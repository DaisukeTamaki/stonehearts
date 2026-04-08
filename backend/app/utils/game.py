"""SGF parsing and board-state utilities backed by sgfmill."""

from __future__ import annotations

import logging
from typing import Any

from sgfmill import sgf
from sgfmill.boards import Board

from app.schemas.game import BoardPosition, GameStone

logger = logging.getLogger(__name__)


def parse_sgf_content(sgf_content: str) -> dict[str, Any]:
    """Parse SGF text and return a dict of game metadata + main_sequence nodes."""
    sgf_game = sgf.Sgf_game.from_string(sgf_content)
    root = sgf_game.get_root()

    winner, end_condition = _parse_result(
        root.get("RE") if root.has_property("RE") else None
    )

    return {
        "board_size": sgf_game.get_size(),
        "komi": sgf_game.get_komi(),
        "player_black": sgf_game.get_player_name("b") or "Unknown",
        "player_white": sgf_game.get_player_name("w") or "Unknown",
        "winner": winner,
        "end_condition": end_condition,
        "main_sequence": sgf_game.get_main_sequence(),
    }


def get_occupied_points(game: Any, target_turn: int) -> BoardPosition:
    """Replay non-variation moves up to *target_turn* and return occupied stones."""
    board = Board(game.board_size)

    sorted_moves = sorted(
        [m for m in game.moves if not m.is_variation],
        key=lambda m: m.turn_number,
    )
    for move in sorted_moves:
        if move.turn_number > target_turn:
            break
        y = game.board_size - 1 - move.y
        color = "b" if move.color.value == "black" else "w"
        board.play(y, move.x, color)

    stones = [
        GameStone(
            x=x,
            y=game.board_size - 1 - y,
            color="black" if c == "b" else "white",
        )
        for c, (y, x) in board.list_occupied_points()
    ]

    return BoardPosition(
        game_id=game.game_id,
        player_black=game.player_black,
        player_white=game.player_white,
        board_size=game.board_size,
        komi=game.komi,
        game_date=game.game_date,
        winner=game.winner,
        end_condition=game.end_condition,
        score_difference=game.score_difference,
        game_name=game.game_name,
        is_draft=game.is_draft,
        occupied_points=stones,
    )


def _parse_result(result: str | None) -> tuple[str | None, str | None]:
    if not result or "+" not in result:
        return None, None
    side, detail = result.split("+", 1)
    winner = {"B": "black", "W": "white"}.get(side)
    end_condition = {"R": "resignation", "T": "time"}.get(detail, "score")
    return winner, end_condition
