import uuid
from datetime import datetime, timezone

from sqlalchemy import Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.types import EndCondition, Rules, Winner


class Game(Base):
    __tablename__ = "games"

    game_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, index=True
    )
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    player_black: Mapped[str | None] = mapped_column(String, index=True)
    player_white: Mapped[str | None] = mapped_column(String, index=True)
    board_size: Mapped[int] = mapped_column(Integer, default=19)
    komi: Mapped[float] = mapped_column(Float, default=6.5)
    handicap: Mapped[int | None] = mapped_column(Integer)
    game_date: Mapped[datetime | None]
    rules: Mapped[Rules | None] = mapped_column(Enum(Rules))
    winner: Mapped[Winner | None] = mapped_column(Enum(Winner))
    end_condition: Mapped[EndCondition | None] = mapped_column(Enum(EndCondition))
    score_difference: Mapped[float | None] = mapped_column(Float)
    game_name: Mapped[str | None] = mapped_column(String)
    is_draft: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    expires_at: Mapped[datetime | None] = mapped_column(index=True)

    owner: Mapped["User | None"] = relationship(back_populates="games")  # noqa: F821
    moves: Mapped[list["Move"]] = relationship(  # noqa: F821
        back_populates="game", order_by="Move.turn_number"
    )
