"""WebSocket relay between the frontend client and a KataGo analysis server.

The handler connects to the upstream KataGo WebSocket, translates
client analysis requests into KataGo queries (coordinate transforms,
initial-stone handling), streams results back, and persists final
analysis snapshots to the database.
"""

from __future__ import annotations

import asyncio
import json
import logging

import websockets
from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import models, schemas
from app.config import settings
from app.db import async_session

logger = logging.getLogger(__name__)

DEFAULT_MAX_VISITS = 1000


class AnalysisRelay:
    """Bridges a single frontend WebSocket to the KataGo server."""

    def __init__(
        self,
        frontend_ws: WebSocket,
        current_user: models.User | None = None,
    ) -> None:
        self.frontend_ws = frontend_ws
        self.current_user = current_user
        self._katago_ws: websockets.WebSocketClientProtocol | None = None
        self._running = True
        self._queue: asyncio.Queue[str] = asyncio.Queue()

    async def run(self) -> None:
        await self.frontend_ws.accept()
        try:
            self._katago_ws = await websockets.connect(settings.KATAGO_SERVER_URL)
            tasks = [
                asyncio.create_task(self._recv_frontend()),
                asyncio.create_task(self._process_queue()),
                asyncio.create_task(self._recv_katago()),
            ]
            await asyncio.gather(*tasks)
        finally:
            self._running = False
            if self._katago_ws:
                await self._katago_ws.close()

    # ----- receive loops -----

    async def _recv_frontend(self) -> None:
        try:
            while self._running:
                data = await self.frontend_ws.receive_text()
                await self._queue.put(data)
        except Exception:
            self._running = False
            raise

    async def _process_queue(self) -> None:
        try:
            while self._running:
                raw = await self._queue.get()
                if raw == "ping":
                    await self.frontend_ws.send_text("pong")
                    continue
                data = json.loads(raw)
                await self._handle_request(data)
        except Exception:
            self._running = False
            raise

    async def _recv_katago(self) -> None:
        assert self._katago_ws is not None
        try:
            while self._running:
                msg = await self._katago_ws.recv()
                analysis = json.loads(msg)
                await self.frontend_ws.send_json(analysis)
                if not analysis.get("isDuringSearch", False):
                    await self._persist_analysis(analysis)
        except Exception:
            self._running = False
            raise

    # ----- request handling -----

    async def _handle_request(self, data: dict) -> None:
        req = schemas.AnalyzeRequestClient(**data)

        if req.action == "terminate" and req.terminate_id:
            await self._send_katago({
                "id": req.query_id,
                "action": "terminate",
                "terminateId": req.terminate_id,
            })
            return

        async with async_session() as db:
            game = await self._load_game(db, req.game_id)
            is_variation = "_variation" in req.query_id
            moves_to_analyze = self._resolve_moves(
                game, is_variation, req.move_ids
            )
            transformed = self._build_move_list(game, moves_to_analyze)
            turns = (
                [m.turn_number for m in moves_to_analyze] if moves_to_analyze else [0]
            )

            query: dict = {
                "id": req.query_id,
                "komi": game.komi,
                "boardSize": game.board_size,
                "moves": transformed,
                "analyzeTurns": turns,
                "maxVisits": req.max_visits or DEFAULT_MAX_VISITS,
            }

            initial = self._get_initial_stones(game)
            if initial:
                query["initialStones"] = initial

            await self._send_katago(query)

    # ----- persistence -----

    async def _persist_analysis(self, data: dict) -> None:
        if data.get("noResults"):
            return
        turn = data.get("turnNumber")
        if turn is None or turn == 0:
            return
        query_id: str = data.get("id", "")
        if "_variation" in query_id:
            return

        game_id = query_id.split("_")[0]

        async with async_session() as db:
            try:
                move = (
                    await db.execute(
                        select(models.Move).where(
                            models.Move.game_id == game_id,
                            models.Move.turn_number == turn,
                            models.Move.is_variation.is_(False),
                        )
                    )
                ).scalar_one_or_none()
                if not move:
                    return

                existing = (
                    await db.execute(
                        select(models.Analysis).where(
                            models.Analysis.move_id == move.move_id
                        )
                    )
                ).scalar_one_or_none()
                if existing:
                    await db.delete(existing)
                    await db.flush()

                root = data["rootInfo"]
                db.add(models.Analysis(
                    game_id=game_id,
                    move_id=move.move_id,
                    current_player="black" if root["currentPlayer"] == "B" else "white",
                    winrate=root["winrate"],
                    score_lead=root["scoreLead"],
                    score_stdev=root["scoreStdev"],
                    visits=root["visits"],
                    raw_json=data,
                ))
                await db.commit()
            except Exception:
                await db.rollback()
                logger.exception("Failed to persist analysis for turn %s", turn)

    # ----- helpers -----

    async def _send_katago(self, payload: dict) -> None:
        assert self._katago_ws is not None
        await self._katago_ws.send(json.dumps(payload))

    @staticmethod
    async def _load_game(db: AsyncSession, game_id) -> models.Game:
        from sqlalchemy.orm import selectinload

        stmt = (
            select(models.Game)
            .options(selectinload(models.Game.moves))
            .where(models.Game.game_id == str(game_id))
        )
        result = await db.execute(stmt)
        game = result.unique().scalar_one()
        return game

    @staticmethod
    def _resolve_moves(
        game: models.Game,
        is_variation: bool,
        move_ids: list | None,
    ) -> list[models.Move]:
        if move_ids is not None:
            id_set = {str(mid) for mid in move_ids}
            return [
                m for m in game.moves
                if str(m.move_id) in id_set and m.is_variation == is_variation
            ]
        return [m for m in game.moves if m.is_variation == is_variation]

    @staticmethod
    def _flip(x: int, y: int, board_size: int) -> tuple[int, int]:
        return (board_size - 1 - y, x)

    def _to_katago_move(self, move: models.Move, board_size: int) -> dict:
        return {
            "color": "B" if move.color.value == "black" else "W",
            "position": self._flip(move.x, move.y, board_size),
        }

    def _get_initial_stones(self, game: models.Game) -> list[dict]:
        return [
            self._to_katago_move(m, game.board_size)
            for m in game.moves
            if m.is_initial
        ]

    def _build_move_list(
        self,
        game: models.Game,
        analyzed_moves: list[models.Move],
    ) -> list[dict]:
        if not analyzed_moves:
            return [
                self._to_katago_move(m, game.board_size)
                for m in game.moves
                if not m.is_variation and not m.is_initial
            ]

        last = analyzed_moves[-1]
        if last.is_variation:
            first_var_turn = min(
                m.turn_number for m in game.moves if m.is_variation
            )
            return [
                self._to_katago_move(m, game.board_size)
                for m in game.moves
                if not m.is_initial
                and (
                    (not m.is_variation and m.turn_number < first_var_turn)
                    or (m.is_variation and m.turn_number <= last.turn_number)
                )
            ]
        return [
            self._to_katago_move(m, game.board_size)
            for m in game.moves
            if not m.is_variation and not m.is_initial
        ]
