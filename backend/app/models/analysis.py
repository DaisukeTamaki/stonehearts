import uuid

from sqlalchemy import Enum, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.types import Color


class Analysis(Base):
    __tablename__ = "analysis"

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, index=True
    )
    game_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("games.game_id"))
    move_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("moves.move_id"), unique=True
    )
    current_player: Mapped[Color] = mapped_column(Enum(Color), nullable=False)
    winrate: Mapped[float] = mapped_column(Float, nullable=False)
    score_lead: Mapped[float] = mapped_column(Float, nullable=False)
    score_stdev: Mapped[float] = mapped_column(Float, nullable=False)
    visits: Mapped[int] = mapped_column(Integer, nullable=False)
    raw_json: Mapped[dict] = mapped_column(JSON, nullable=False)

    move: Mapped["Move | None"] = relationship(back_populates="analysis")  # noqa: F821
