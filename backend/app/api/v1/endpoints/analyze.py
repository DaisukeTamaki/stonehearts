import logging

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import models
from app.api.deps import get_optional_user_ws
from app.crud.analyze import AnalysisRelay
from app.db import get_db

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/analyze")
async def websocket_analyze(
    websocket: WebSocket,
    db: AsyncSession = Depends(get_db),
    current_user: models.User | None = Depends(get_optional_user_ws),
    game_id: str | None = Query(None),
) -> None:
    if game_id:
        result = await db.execute(
            select(models.Game).where(models.Game.game_id == game_id)
        )
        game = result.scalar_one_or_none()
        if not game:
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason="Game not found"
            )
            return
        if game.owner_id is not None and (
            not current_user or game.owner_id != current_user.id
        ):
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION, reason="Not authorized"
            )
            return

    relay = AnalysisRelay(websocket, current_user)
    try:
        await relay.run()
    except WebSocketDisconnect:
        logger.info("Analysis WebSocket disconnected")
    except Exception:
        logger.exception("Error in analysis WebSocket")
