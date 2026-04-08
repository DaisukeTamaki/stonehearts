import type { GameStoreThis } from "../types";
import type { GameHistoryEntry } from "~/types/goTypes";
import { boardService } from "~/services/boardService";

export const gamePvActions = {
  enterPvMode(this: GameStoreThis, rank: number): void {
    if (this.isPvMode && this.pvBackup) {
      this.gameHistory = [...this.pvBackup.gameHistory];
      this.currentMoveIndex = this.pvBackup.currentMoveIndex;
    }

    const pvStones = this.getPrincipalVariationStones(rank);
    if (!pvStones.length) return;

    if (!this.isPvMode) {
      this.pvBackup = {
        gameHistory: [...this.gameHistory],
        currentMoveIndex: this.currentMoveIndex,
      };
    }

    const pvHistory: GameHistoryEntry[] = pvStones.map((stones) => ({
      board: boardService.createBoard(this.boardSize),
      stones,
      candidateMoves: [],
    }));

    const baseMove = this.pvBackup
      ? this.pvBackup.gameHistory[this.pvBackup.currentMoveIndex]
      : this.gameHistory[this.currentMoveIndex];

    this.gameHistory = [baseMove, ...pvHistory];
    this.currentMoveIndex = this.gameHistory.length - 1;
    this.isPvMode = true;
    this.selectedCandidateRank = rank;
  },

  exitPvMode(this: GameStoreThis): void {
    if (!this.pvBackup) return;
    this.gameHistory = this.pvBackup.gameHistory;
    this.currentMoveIndex = this.pvBackup.currentMoveIndex;
    this.pvBackup = null;
    this.isPvMode = false;
    this.selectedCandidateRank = null;
  },
} as const;
