from uuid import UUID

from pydantic import BaseModel

from app.types import Color

__all__ = [
    "AnalyzeRequestClient",
    "BatchAnalysisRequest",
    "AnalysisRead",
]


class AnalyzeRequestClient(BaseModel):
    query_id: str
    game_id: UUID
    move_ids: list[UUID] | None = None
    max_visits: int | None = None
    action: str | None = None
    terminate_id: str | None = None


class BatchAnalysisRequest(BaseModel):
    game_id: UUID


class AnalysisRead(BaseModel):
    analysis_id: UUID
    game_id: UUID
    move_id: UUID
    current_player: Color
    winrate: float
    score_lead: float
    score_stdev: float
    visits: int
    raw_json: dict
