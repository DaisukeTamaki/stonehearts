from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app import models


async def get_user_by_email(db: AsyncSession, email: str) -> models.User | None:
    result = await db.execute(select(models.User).where(models.User.email == email))
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    email: str,
    name: str | None,
    oauth_provider: str,
    oauth_provider_id: str,
) -> models.User:
    now = datetime.now(timezone.utc)
    user = models.User(
        email=email,
        name=name,
        oauth_provider=oauth_provider,
        oauth_provider_id=oauth_provider_id,
        created_at=now,
        last_login_at=now,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user: models.User) -> bool:
    """Delete a user and all associated games, moves, and analyses."""
    result = await db.execute(
        select(models.Game).where(models.Game.owner_id == user.id)
    )
    user_games = result.scalars().all()

    for game in user_games:
        await db.execute(
            delete(models.Analysis).where(models.Analysis.game_id == game.game_id)
        )
        await db.execute(
            delete(models.Move).where(models.Move.game_id == game.game_id)
        )
        await db.delete(game)

    await db.delete(user)
    await db.commit()
    return True
