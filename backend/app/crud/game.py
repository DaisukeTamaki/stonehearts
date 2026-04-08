from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app import models, schemas
from app.config import settings
from app.utils.game import get_occupied_points, parse_sgf_content

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Game CRUD
# ---------------------------------------------------------------------------


async def create_game(
    db: AsyncSession,
    game_in: schemas.GameMetaCreate,
    current_user: models.User | None,
) -> schemas.GameRead:
    data = game_in.model_dump(exclude={"is_anonymous"})

    owner_id = None
    expires_at = None
    if game_in.is_anonymous or current_user is None:
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.ANONYMOUS_GAME_LIFETIME_DAYS
        )
    else:
        owner_id = current_user.id

    game = models.Game(**data, owner_id=owner_id, expires_at=expires_at)
    db.add(game)
    await db.commit()

    return await _load_game_read(db, game.game_id)


async def list_games(
    db: AsyncSession,
    owner_id: uuid.UUID,
    *,
    skip: int = 0,
    limit: int = 100,
    draft: bool | None = None,
) -> list[schemas.GameMetaRead]:
    stmt = (
        select(models.Game)
        .where(models.Game.owner_id == owner_id)
        .order_by(models.Game.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if draft is not None:
        stmt = stmt.where(models.Game.is_draft == draft)

    result = await db.execute(stmt)
    games = result.scalars().all()
    return [
        schemas.GameMetaRead.model_validate(g, from_attributes=True) for g in games
    ]


async def read_game(
    db: AsyncSession,
    game_id: uuid.UUID,
    current_user_id: uuid.UUID | None,
) -> schemas.GameReadWithAnalysis:
    stmt = (
        select(models.Game)
        .options(
            selectinload(models.Game.moves).selectinload(models.Move.analysis),
        )
        .where(
            models.Game.game_id == game_id,
            or_(models.Game.owner_id == current_user_id, models.Game.owner_id.is_(None)),
        )
    )
    result = await db.execute(stmt)
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(404, "Game not found")
    return schemas.GameReadWithAnalysis.model_validate(game, from_attributes=True)


async def update_game(
    db: AsyncSession,
    game_id: uuid.UUID,
    game_in: schemas.GameMetaUpdate,
    current_user: models.User,
) -> schemas.GameMetaRead:
    game = await _get_owned_game(db, game_id, current_user)

    for key, value in game_in.model_dump(exclude_unset=True).items():
        setattr(game, key, value)
    game.updated_at = datetime.now(timezone.utc)

    db.add(game)
    await db.commit()
    await db.refresh(game)
    return schemas.GameMetaRead.model_validate(game, from_attributes=True)


async def delete_game(
    db: AsyncSession,
    game_id: uuid.UUID,
    current_user: models.User | None,
) -> None:
    game = await db.get(models.Game, game_id)
    if not game:
        raise HTTPException(404, "Game not found")

    if game.owner_id is not None:
        if current_user is None:
            raise HTTPException(403, "Authentication required")
        if game.owner_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(403, "Insufficient permissions")

    await db.execute(delete(models.Analysis).where(models.Analysis.game_id == game_id))
    await db.execute(delete(models.Move).where(models.Move.game_id == game_id))
    await db.delete(game)
    await db.commit()


# ---------------------------------------------------------------------------
# Moves
# ---------------------------------------------------------------------------


async def add_move(
    db: AsyncSession,
    game_id: uuid.UUID,
    move_in: schemas.MoveCreate,
    current_user_id: uuid.UUID | None,
) -> schemas.MoveRead:
    game = await _get_accessible_game(db, game_id, current_user_id)

    last = await _last_main_move(db, game_id)
    expected = (last.turn_number + 1) if last else 1
    if move_in.turn_number != expected:
        raise HTTPException(400, "Invalid turn number")

    move = models.Move(game_id=game_id, **move_in.model_dump())
    db.add(move)
    game.updated_at = datetime.now(timezone.utc)
    db.add(game)
    await db.commit()
    await db.refresh(move)
    return schemas.MoveRead.model_validate(move, from_attributes=True)


async def update_move(
    db: AsyncSession,
    game_id: uuid.UUID,
    move_id: uuid.UUID,
    move_in: schemas.MoveCreate,
    current_user_id: uuid.UUID | None,
) -> schemas.MoveRead:
    game = await _get_accessible_game(db, game_id, current_user_id)
    move = await _get_move(db, game_id, move_id)

    # Delete analysis for this move and all subsequent moves
    await _delete_from_turn(db, game_id, move.turn_number + 1, include_analyses=True)
    await db.execute(delete(models.Analysis).where(models.Analysis.move_id == move_id))

    for attr, value in move_in.model_dump().items():
        setattr(move, attr, value)
    game.updated_at = datetime.now(timezone.utc)
    db.add(game)
    await db.commit()
    await db.refresh(move)
    return schemas.MoveRead.model_validate(move, from_attributes=True)


async def delete_move(
    db: AsyncSession,
    game_id: uuid.UUID,
    move_id: uuid.UUID,
    current_user_id: uuid.UUID | None,
) -> None:
    game = await _get_accessible_game(db, game_id, current_user_id)
    move = await _get_move(db, game_id, move_id)

    await _delete_from_turn(db, game_id, move.turn_number, include_analyses=True)
    game.updated_at = datetime.now(timezone.utc)
    db.add(game)
    await db.commit()


# ---------------------------------------------------------------------------
# Variations
# ---------------------------------------------------------------------------


async def add_variation(
    db: AsyncSession,
    game_id: uuid.UUID,
    move_in: schemas.MoveCreate,
    current_user_id: uuid.UUID | None,
) -> schemas.MoveRead:
    if not move_in.is_variation:
        raise HTTPException(400, "Move must be marked as variation")

    game = await _get_accessible_game(db, game_id, current_user_id)

    last_var = await _last_variation_move(db, game_id)
    last_main = await _last_main_move(db, game_id)
    expected = max(
        (last_var.turn_number if last_var else 0),
        (last_main.turn_number if last_main else 0),
    ) + 1

    if move_in.turn_number == expected:
        new_move = models.Move(game_id=game_id, **move_in.model_dump())
        db.add(new_move)
    elif move_in.turn_number < expected:
        # Overwrite: delete existing variation at this turn and all subsequent
        await _delete_variations_from_turn(db, game_id, move_in.turn_number)
        new_move = models.Move(game_id=game_id, **move_in.model_dump())
        db.add(new_move)
    else:
        raise HTTPException(400, "Invalid turn number for variation")

    game.updated_at = datetime.now(timezone.utc)
    db.add(game)
    await db.commit()
    await db.refresh(new_move)
    return schemas.MoveRead.model_validate(new_move, from_attributes=True)


async def set_variation_as_main(
    db: AsyncSession,
    game_id: uuid.UUID,
    current_user_id: uuid.UUID | None,
) -> bool:
    game = await _get_accessible_game(db, game_id, current_user_id)

    first_var = (
        await db.execute(
            select(models.Move)
            .where(models.Move.game_id == game_id, models.Move.is_variation.is_(True))
            .order_by(models.Move.turn_number.asc())
        )
    ).scalar_one_or_none()
    if not first_var:
        raise HTTPException(404, "No variation moves found")

    # Delete main moves from the branch point onward
    main_from_branch = (
        await db.execute(
            select(models.Move).where(
                models.Move.game_id == game_id,
                models.Move.turn_number >= first_var.turn_number,
                models.Move.is_variation.is_(False),
            )
        )
    ).scalars().all()
    for m in main_from_branch:
        await db.execute(delete(models.Analysis).where(models.Analysis.move_id == m.move_id))
        await db.delete(m)

    # Promote variation moves to main
    variations = (
        await db.execute(
            select(models.Move).where(
                models.Move.game_id == game_id, models.Move.is_variation.is_(True)
            )
        )
    ).scalars().all()
    for m in variations:
        m.is_variation = False

    game.updated_at = datetime.now(timezone.utc)
    db.add(game)
    await db.commit()
    return True


async def clear_variations(
    db: AsyncSession,
    game_id: uuid.UUID,
    current_user_id: uuid.UUID | None,
) -> None:
    game = await _get_accessible_game(db, game_id, current_user_id)

    var_moves = (
        await db.execute(
            select(models.Move).where(
                models.Move.game_id == game_id, models.Move.is_variation.is_(True)
            )
        )
    ).scalars().all()
    if not var_moves:
        raise HTTPException(404, "No variation moves found")

    for m in var_moves:
        await db.execute(delete(models.Analysis).where(models.Analysis.move_id == m.move_id))
    await db.execute(
        delete(models.Move).where(
            models.Move.game_id == game_id, models.Move.is_variation.is_(True)
        )
    )

    game.updated_at = datetime.now(timezone.utc)
    db.add(game)
    await db.commit()


# ---------------------------------------------------------------------------
# SGF import
# ---------------------------------------------------------------------------


async def create_game_from_sgf(
    db: AsyncSession,
    sgf_content: str,
    owner_id: uuid.UUID,
) -> schemas.GameRead:
    parsed = parse_sgf_content(sgf_content)
    main_sequence = parsed.pop("main_sequence")
    board_size: int = parsed["board_size"]

    game = models.Game(owner_id=owner_id, **parsed)
    db.add(game)
    await db.commit()
    await db.refresh(game)

    # Setup stones from root node
    root_node = main_sequence[0]
    blacks, whites, _ = root_node.get_setup_stones()
    for color_str, points in [("black", blacks), ("white", whites)]:
        for row, col in points:
            db.add(models.Move(
                game_id=game.game_id,
                color=color_str,
                turn_number=0,
                x=col,
                y=board_size - 1 - row,
                is_initial=True,
            ))

    # Regular moves
    turn = 0
    for node in main_sequence:
        color, pos = node.get_move()
        if color and pos:
            turn += 1
            row, col = pos
            db.add(models.Move(
                game_id=game.game_id,
                color="black" if color == "b" else "white",
                turn_number=turn,
                x=col,
                y=board_size - 1 - row,
            ))

    await db.commit()
    return await _load_game_read(db, game.game_id)


# ---------------------------------------------------------------------------
# Board position helpers
# ---------------------------------------------------------------------------


async def get_board_positions(
    db: AsyncSession,
    owner_id: uuid.UUID,
    target_turn: int,
    *,
    skip: int = 0,
    limit: int = 100,
    draft: bool | None = None,
) -> list[schemas.BoardPosition]:
    stmt = (
        select(models.Game)
        .options(selectinload(models.Game.moves))
        .where(models.Game.owner_id == owner_id)
        .order_by(models.Game.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )
    if draft is not None:
        stmt = stmt.where(models.Game.is_draft == draft)

    result = await db.execute(stmt)
    games = result.scalars().all()
    return [get_occupied_points(g, target_turn) for g in games]


async def get_board_position(
    db: AsyncSession,
    game_id: uuid.UUID,
    target_turn: int,
    owner_id: uuid.UUID,
) -> schemas.BoardPosition:
    stmt = (
        select(models.Game)
        .options(selectinload(models.Game.moves))
        .where(models.Game.game_id == game_id, models.Game.owner_id == owner_id)
    )
    result = await db.execute(stmt)
    game = result.scalar_one_or_none()
    if not game:
        raise HTTPException(404, "Game not found")
    return get_occupied_points(game, target_turn)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _get_owned_game(
    db: AsyncSession, game_id: uuid.UUID, user: models.User
) -> models.Game:
    game = await db.get(models.Game, game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    if game.owner_id != user.id and not user.is_superuser:
        raise HTTPException(403, "Insufficient permissions")
    return game


async def _get_accessible_game(
    db: AsyncSession, game_id: uuid.UUID, user_id: uuid.UUID | None
) -> models.Game:
    """Return game if user owns it or if it's anonymous."""
    game = await db.get(models.Game, game_id)
    if not game:
        raise HTTPException(404, "Game not found")
    if game.owner_id is not None and game.owner_id != user_id:
        raise HTTPException(403, "Not authorized for this game")
    return game


async def _get_move(
    db: AsyncSession, game_id: uuid.UUID, move_id: uuid.UUID
) -> models.Move:
    move = await db.get(models.Move, move_id)
    if not move or move.game_id != game_id:
        raise HTTPException(404, "Move not found")
    return move


async def _last_main_move(
    db: AsyncSession, game_id: uuid.UUID
) -> models.Move | None:
    result = await db.execute(
        select(models.Move)
        .where(
            models.Move.game_id == game_id,
            models.Move.is_variation.is_(False),
            models.Move.is_initial.is_(False),
        )
        .order_by(models.Move.turn_number.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _last_variation_move(
    db: AsyncSession, game_id: uuid.UUID
) -> models.Move | None:
    result = await db.execute(
        select(models.Move)
        .where(models.Move.game_id == game_id, models.Move.is_variation.is_(True))
        .order_by(models.Move.turn_number.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _delete_from_turn(
    db: AsyncSession,
    game_id: uuid.UUID,
    from_turn: int,
    *,
    include_analyses: bool = False,
) -> None:
    """Delete main-line moves (and optionally analyses) at or after *from_turn*."""
    moves = (
        await db.execute(
            select(models.Move).where(
                models.Move.game_id == game_id,
                models.Move.turn_number >= from_turn,
                models.Move.is_variation.is_(False),
            )
        )
    ).scalars().all()
    for m in moves:
        if include_analyses:
            await db.execute(
                delete(models.Analysis).where(models.Analysis.move_id == m.move_id)
            )
        await db.delete(m)


async def _delete_variations_from_turn(
    db: AsyncSession, game_id: uuid.UUID, from_turn: int
) -> None:
    moves = (
        await db.execute(
            select(models.Move).where(
                models.Move.game_id == game_id,
                models.Move.turn_number >= from_turn,
                models.Move.is_variation.is_(True),
            )
        )
    ).scalars().all()
    for m in moves:
        await db.execute(
            delete(models.Analysis).where(models.Analysis.move_id == m.move_id)
        )
        await db.delete(m)


async def _load_game_read(
    db: AsyncSession, game_id: uuid.UUID
) -> schemas.GameRead:
    stmt = (
        select(models.Game)
        .options(selectinload(models.Game.moves))
        .where(models.Game.game_id == game_id)
    )
    result = await db.execute(stmt)
    game = result.unique().scalar_one()
    return schemas.GameRead.model_validate(game, from_attributes=True)
