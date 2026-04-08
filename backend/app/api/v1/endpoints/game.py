import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_optional_user
from app.crud import game as game_crud
from app.db import get_db
from app.models.user import User
from app.schemas.game import (
    BoardPosition,
    GameMetaCreate,
    GameMetaRead,
    GameMetaUpdate,
    GameRead,
    GameReadWithAnalysis,
    MoveCreate,
    MoveRead,
    SGFContent,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Games
# ---------------------------------------------------------------------------


@router.post("", response_model=GameRead)
async def create_game(
    game_in: GameMetaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> GameRead:
    return await game_crud.create_game(db, game_in, current_user)


@router.get("", response_model=list[GameMetaRead])
async def list_games(
    skip: int = 0,
    limit: int = 100,
    draft: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GameMetaRead]:
    return await game_crud.list_games(
        db, current_user.id, skip=skip, limit=limit, draft=draft
    )


@router.get("/board_positions", response_model=list[BoardPosition])
async def get_board_positions(
    target_turn: int,
    skip: int = 0,
    limit: int = 100,
    draft: bool | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BoardPosition]:
    return await game_crud.get_board_positions(
        db, current_user.id, target_turn, skip=skip, limit=limit, draft=draft
    )


@router.get("/board_position/{game_id}", response_model=BoardPosition)
async def get_board_position(
    game_id: uuid.UUID,
    target_turn: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BoardPosition:
    return await game_crud.get_board_position(db, game_id, target_turn, current_user.id)


@router.get("/{game_id}", response_model=GameReadWithAnalysis)
async def read_game(
    game_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> GameReadWithAnalysis:
    user_id = current_user.id if current_user else None
    return await game_crud.read_game(db, game_id, user_id)


@router.put("/{game_id}", response_model=GameMetaRead)
async def update_game(
    game_id: uuid.UUID,
    game_in: GameMetaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GameMetaRead:
    return await game_crud.update_game(db, game_id, game_in, current_user)


@router.delete("/{game_id}")
async def delete_game(
    game_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> dict[str, str]:
    await game_crud.delete_game(db, game_id, current_user)
    return {"message": "Game deleted"}


# ---------------------------------------------------------------------------
# Moves
# ---------------------------------------------------------------------------


@router.post("/{game_id}/moves", response_model=MoveRead)
async def add_move(
    game_id: uuid.UUID,
    move_in: MoveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> MoveRead:
    user_id = current_user.id if current_user else None
    return await game_crud.add_move(db, game_id, move_in, user_id)


@router.put("/{game_id}/moves/{move_id}", response_model=MoveRead)
async def update_move(
    game_id: uuid.UUID,
    move_id: uuid.UUID,
    move_in: MoveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> MoveRead:
    user_id = current_user.id if current_user else None
    return await game_crud.update_move(db, game_id, move_id, move_in, user_id)


@router.delete("/{game_id}/moves/{move_id}")
async def delete_move(
    game_id: uuid.UUID,
    move_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> dict[str, str]:
    user_id = current_user.id if current_user else None
    await game_crud.delete_move(db, game_id, move_id, user_id)
    return {"message": "Move deleted"}


# ---------------------------------------------------------------------------
# SGF
# ---------------------------------------------------------------------------


@router.post("/sgf", response_model=GameRead)
async def create_game_from_sgf(
    sgf_content: SGFContent,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GameRead:
    return await game_crud.create_game_from_sgf(db, sgf_content.content, current_user.id)


# ---------------------------------------------------------------------------
# Variations
# ---------------------------------------------------------------------------


@router.put("/{game_id}/variation", response_model=MoveRead)
async def add_variation(
    game_id: uuid.UUID,
    move_in: MoveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> MoveRead:
    user_id = current_user.id if current_user else None
    return await game_crud.add_variation(db, game_id, move_in, user_id)


@router.put("/{game_id}/set-variation-as-main")
async def set_variation_as_main(
    game_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> bool:
    user_id = current_user.id if current_user else None
    return await game_crud.set_variation_as_main(db, game_id, user_id)


@router.delete("/{game_id}/clear-variations")
async def clear_variations(
    game_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> dict[str, str]:
    user_id = current_user.id if current_user else None
    await game_crud.clear_variations(db, game_id, user_id)
    return {"message": "Variations cleared"}
