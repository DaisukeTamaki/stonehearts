import type { GameStoreThis } from "../types";
import type { GoCoordinateType, GameHistoryEntry, GoBoardSizeType } from "~/types/goTypes";
import type { Move, MoveCreate, GameReadWithAnalysis, MoveModel } from "~/types/apiGameTypes";
import { boardService } from "~/services/boardService";
import { analysisService } from "~/services/analysisService";
import * as gameService from "~/services/gameService";
import Board from "@sabaki/go-board";

export const gameBoardActions = {
  async makeMove(this: GameStoreThis, coord: GoCoordinateType): Promise<void> {
    if (!this.gameId) throw new Error("Game ID is not set");

    const currentPlayer = this.getCurrentPlayer;
    const sign = boardService.colorToSign(currentPlayer);
    const currentBoard = this.gameHistory[this.currentMoveIndex].board;
    const result = boardService.makeMove(currentBoard, coord, sign);
    if (!result.success || !result.board) return;

    try {
      const isNewVariation = !this.isLastMove && !this.backup;
      if (isNewVariation) this.backupGameHistory();

      const move: MoveCreate = {
        turn_number: this.currentMoveIndex + 1,
        color: currentPlayer,
        x: coord.x, y: coord.y,
        is_initial: false,
        is_variation: !!this.backup,
      };

      if (this.gameReadWithAnalysis && !this.isLastMove) {
        this.regularMoves.splice(this.currentMoveIndex);
      }
      if (!this.isLastMove) this.gameHistory.splice(this.currentMoveIndex + 1);

      this.gameHistory.push({
        board: result.board,
        stones: boardService.convertBoardToStones(result.board, coord),
        candidateMoves: [],
      });

      this.navigate(() => { this.currentMoveIndex++; }, { triggerAnalysis: false });

      let newMove: Move;
      if (move.is_variation) {
        newMove = await gameService.addVariation(this.gameId, move);
      } else {
        newMove = await gameService.addMove(this.gameId, move);
      }
      this.regularMoves.push(newMove);
      this.analyzeCurrentMove();
    } catch {
      this.gameHistory.pop();
      this.currentMoveIndex--;
      this.error = "Failed to add move";
    }
  },

  async deleteCurrentMove(this: GameStoreThis): Promise<void> {
    if (!this.gameId || !this.gameReadWithAnalysis || this.currentMoveIndex === 0) return;
    const currentMove = this.regularMoves[this.currentMoveIndex - 1];
    if (!currentMove) return;

    try {
      await gameService.deleteMove(this.gameId, currentMove.move_id);
      this.regularMoves.splice(this.currentMoveIndex - 1);
      this.gameHistory.splice(this.currentMoveIndex);
      this.currentMoveIndex--;
    } catch {
      this.error = "Failed to delete move";
    }
  },

  _createInitialHistoryEntry(this: GameStoreThis, boardSize: GoBoardSizeType): GameHistoryEntry {
    return { board: boardService.createBoard(boardSize), stones: [], candidateMoves: [] };
  },

  _reconstructGameHistory(this: GameStoreThis, game: GameReadWithAnalysis): GameHistoryEntry[] {
    let board = boardService.createBoard(game.board_size);

    const initialMoves: MoveModel[] = [];
    const regularMoves: MoveModel[] = [];
    for (const m of game.moves) {
      (m.is_initial ? initialMoves : regularMoves).push(m);
    }

    const signMap = Array(game.board_size).fill(0).map(() => Array(game.board_size).fill(0));
    for (const m of initialMoves) signMap[m.y][m.x] = boardService.colorToSign(m.color);
    board = new Board(signMap);

    const initialStones = initialMoves.map((m) => ({
      x: m.x, y: m.y, color: m.color, isLastMove: false,
    }));

    const history: GameHistoryEntry[] = [{ board, stones: initialStones, candidateMoves: [] }];

    for (const move of regularMoves) {
      const sign = boardService.colorToSign(move.color);
      const res = boardService.makeMove(board, { x: move.x, y: move.y }, sign);
      if (res.success && res.board) {
        board = res.board;
        const stones = boardService.convertBoardToStones(board, { x: move.x, y: move.y });
        const candidateMoves = move.analysis
          ? analysisService.convertAnalysisToCandidateStones(move.analysis, this.boardSize)
          : [];
        history.push({
          board, stones, candidateMoves,
          blackWinRate: move.analysis?.rootInfo.winrate,
          blackScoreLead: move.analysis?.rootInfo.scoreLead,
          scoreStdev: move.analysis?.rootInfo.scoreStdev,
          visits: move.analysis?.rootInfo.visits,
        });
      }
    }
    return history;
  },

  validateMove(this: GameStoreThis, coord: GoCoordinateType): boolean {
    if (!this.gameHistory[this.currentMoveIndex]) return false;
    const sign = boardService.colorToSign(this.getCurrentPlayer);
    return boardService.makeMove(this.gameHistory[this.currentMoveIndex].board, coord, sign).success;
  },

  getCurrentBoardClone(this: GameStoreThis): Board {
    if (this.isPvMode && this.pvBackup) {
      return boardService.getBoardClone(this.pvBackup.gameHistory[this.pvBackup.currentMoveIndex].board);
    }
    return boardService.getBoardClone(this.gameHistory[this.currentMoveIndex].board);
  },
} as const;
