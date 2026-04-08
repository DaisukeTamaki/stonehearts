import type { GameStoreThis } from "../types";
import { boardService } from "~/services/boardService";
import { helperService } from "~/services/helperService";
import { clearVariations, setVariationAsMain } from "~/services/gameService";
import type { GoCoordinateType } from "~/types/goTypes";

export const gameHelperActions = {
  exportSGF(this: GameStoreThis): string {
    if (!this.gameReadWithAnalysis) return "";
    const moves = this.gameHistory.flatMap((entry, index) => {
      if (index === 0) return [];
      const stone = entry.stones.find((s) => s.isLastMove);
      if (!stone) return [];
      const color = stone.color === "black" ? "B" : "W";
      const coord = helperService.generateSGFCoordinate(stone.x, stone.y);
      const comment = entry.blackWinRate !== undefined
        ? `C[WR: ${helperService.formatWinrate(entry.blackWinRate)}]` : "";
      return [`${color}[${coord}]${comment}`];
    });
    return `(;FF[4]GM[1]SZ[${this.boardSize}]${moves.join(";")})`;
  },

  formatCoordinate(this: GameStoreThis, coord: GoCoordinateType): string {
    const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
    return `${letters[coord.x]}${this.boardSize - coord.y}`;
  },

  parseCoordinate(this: GameStoreThis, coordString: string): GoCoordinateType | null {
    const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
    const match = coordString.match(/^([A-Z])(\d+)$/i);
    if (!match) return null;
    const x = letters.indexOf(match[1].toUpperCase());
    const y = this.boardSize - parseInt(match[2]);
    if (x < 0 || y < 0 || x >= this.boardSize || y >= this.boardSize) return null;
    return { x, y };
  },

  backupGameHistory(this: GameStoreThis): void {
    this.backup = {
      gameHistory: this.gameHistory.map((e) => ({
        board: boardService.getBoardClone(e.board),
        stones: [...e.stones], candidateMoves: [...(e.candidateMoves || [])],
        blackWinRate: e.blackWinRate, blackScoreLead: e.blackScoreLead,
        scoreStdev: e.scoreStdev, visits: e.visits,
      })),
      gameReadWithAnalysis: JSON.parse(JSON.stringify(this.gameReadWithAnalysis)),
      currentMoveIndex: this.currentMoveIndex,
    };
  },

  restoreGameHistoryFromBackup(this: GameStoreThis): void {
    if (!this.backup) return;
    this.gameHistory = this.backup.gameHistory;
    this.gameReadWithAnalysis = this.backup.gameReadWithAnalysis;
    this.currentMoveIndex = this.backup.currentMoveIndex;
    this.backup = null;
    if (this.gameId) clearVariations(this.gameId);
  },

  async setVariationAsMain(this: GameStoreThis): Promise<void> {
    if (!this.gameId) throw new Error("Game ID is not set");
    await setVariationAsMain(this.gameId);
    this.backup = null;
  },
} as const;
