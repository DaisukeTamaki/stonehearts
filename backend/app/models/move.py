import uuid

from sqlalchemy import Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.types import Color


class Move(Base):
    __tablename__ = "moves"

    move_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, index=True
    )
    game_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("games.game_id"))
    turn_number: Mapped[int] = mapped_column(Integer, nullable=False)
    color: Mapped[Color] = mapped_column(Enum(Color), nullable=False)
    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)
    is_initial: Mapped[bool] = mapped_column(default=False)
    is_variation: Mapped[bool] = mapped_column(default=False)

    game: Mapped["Game | None"] = relationship(back_populates="moves")  # noqa: F821
    analysis: Mapped["Analysis | None"] = relationship(  # noqa: F821
        back_populates="move", uselist=False
    )
