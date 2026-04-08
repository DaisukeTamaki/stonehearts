import Board from "@sabaki/go-board";
import type { Vertex } from "@sabaki/go-board";
import { Color } from "~/types/apiGameTypes";
import type { GoBoardSizeType, GoCoordinateType, GoSignType, GoStoneType } from "~/types/goTypes";

export interface MoveResult {
  success: boolean;
  board?: Board;
  error?: string;
}

class BoardService {
  private static instance: BoardService;
  static getInstance(): BoardService {
    if (!BoardService.instance) BoardService.instance = new BoardService();
    return BoardService.instance;
  }

  createBoard(size: GoBoardSizeType): Board {
    return Board.fromDimensions(size);
  }

  getBoardClone(board: Board): Board {
    return board.clone();
  }

  makeMove(board: Board, coord: GoCoordinateType, sign: GoSignType): MoveResult {
    try {
      const newBoard = board.makeMove(sign, [coord.x, coord.y], {
        preventOverwrite: true,
        preventSuicide: true,
        preventKo: true,
      });
      return newBoard ? { success: true, board: newBoard } : { success: false, error: "Invalid move" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  convertBoardToStones(board: Board, lastMove?: GoCoordinateType): GoStoneType[] {
    const stones: GoStoneType[] = [];
    const signMap = board.signMap;
    for (let y = 0; y < signMap.length; y++) {
      for (let x = 0; x < signMap[y].length; x++) {
        const sign = signMap[y][x];
        if (sign !== 0) {
          stones.push({
            x, y,
            color: sign === 1 ? Color.Black : Color.White,
            isLastMove: lastMove ? lastMove.x === x && lastMove.y === y : false,
          });
        }
      }
    }
    return stones;
  }

  getDiffStones(
    oldBoard: Board, newBoard: Board, prevStones: GoStoneType[], turnNumber?: number
  ): GoStoneType[] {
    const changes: Vertex[] | null = oldBoard.diff(newBoard);
    if (!changes) return [];

    let stones = prevStones.map((s) => ({ ...s, isLastMove: false }));
    for (const [x, y] of changes) {
      const idx = stones.findIndex((s) => s.x === x && s.y === y);
      if (idx !== -1) stones.splice(idx, 1);
      const sign = newBoard.get([x, y]);
      if (sign !== 0) {
        stones.push({
          x, y,
          color: sign === 1 ? Color.Black : Color.White,
          turnNumber,
          isLastMove: false,
        });
      }
    }
    return stones;
  }

  getCaptureCount(board: Board, color: Color): number {
    return board.getCaptures(color === Color.Black ? 1 : -1);
  }

  colorToSign(color: Color): GoSignType {
    return color === Color.Black ? 1 : -1;
  }
}

export const boardService = BoardService.getInstance();
