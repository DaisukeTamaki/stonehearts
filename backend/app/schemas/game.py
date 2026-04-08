from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.types import Color, EndCondition, Rules, Winner

__all__ = [
    "GameMetaCreate",
    "GameMetaUpdate",
    "GameMetaRead",
    "GameRead",
    "GameReadWithAnalysis",
    "MoveCreate",
    "MoveRead",
    "MoveWithAnalysis",
    "SGFContent",
    "BoardPosition",
    "GameStone",
]


class _GameMetaBase(BaseModel):
    player_black: str | None = None
    player_white: str | None = None
    board_size: int = 19
    komi: float = Field(default=6.5)
    handicap: int | None = None
    game_date: date | None = None
    rules: Rules | None = None
    winner: Winner | None = None
    end_condition: EndCondition | None = None
    score_difference: float | None = None
    game_name: str | None = None
    is_draft: bool = False


class GameMetaCreate(_GameMetaBase):
    is_anonymous: bool = False


class GameMetaUpdate(BaseModel):
    player_black: str | None = None
    player_white: str | None = None
    board_size: int | None = None
    komi: float | None = None
    game_date: date | None = None
    rules: Rules | None = None
    winner: str | None = None
    end_condition: str | None = None
    score_difference: float | None = None
    game_name: str | None = None
    is_draft: bool | None = None


class GameMetaRead(_GameMetaBase):
    game_id: UUID


class MoveCreate(BaseModel):
    turn_number: int
    color: Color
    x: int
    y: int
    is_initial: bool = False
    is_variation: bool = False


class MoveRead(MoveCreate):
    move_id: UUID
    game_id: UUID


class MoveWithAnalysis(MoveRead):
    analysis: dict | None = None

    @field_validator("analysis", mode="before")
    @classmethod
    def unpack_raw_json(cls, v: object) -> object:
        if v is not None and hasattr(v, "raw_json"):
            return v.raw_json
        return v


class GameRead(GameMetaRead):
    moves: list[MoveRead] = []


class GameReadWithAnalysis(GameMetaRead):
    moves: list[MoveWithAnalysis] = []


class SGFContent(BaseModel):
    content: str


class GameStone(BaseModel):
    x: int
    y: int
    color: Color


class BoardPosition(GameMetaRead):
    occupied_points: list[GameStone] = []
