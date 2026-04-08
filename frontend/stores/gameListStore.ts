import { defineStore } from "pinia";
import type { UUID } from "crypto";
import * as gameService from "~/services/gameService";
import type { GameListState } from "@/types/goTypes";
import type { BoardPosition, GameMetaUpdate } from "@/types/apiGameTypes";

export const useGameListStore = defineStore("gameListStore", {
  state: (): GameListState => ({
    games: {},
    loading: false,
    error: null,
    page: 1,
    limit: 20,
  }),

  actions: {
    getGame(gameId: UUID) {
      return this.games[gameId] ?? null;
    },

    addGame(game: BoardPosition, overwrite = true) {
      if (this.games[game.game_id] && !overwrite) return;
      this.games[game.game_id] = game;
    },

    async removeGame(gameId: UUID) {
      await gameService.deleteGame(gameId);
      delete this.games[gameId];
    },

    async fetchGames(skip: number, limit: number, isDraft?: boolean) {
      this.loading = true;
      this.error = null;
      try {
        const positions = await gameService.getBoardPositions(100, skip, limit, isDraft);
        for (const bp of positions) this.addGame(bp);
      } catch {
        this.error = "Failed to load games.";
      } finally {
        this.loading = false;
      }
    },

    async updateGame(gameId: UUID, gameMeta: GameMetaUpdate) {
      const updated = await gameService.updateGame(gameId, gameMeta);
      const existing = this.games[gameId];
      if (existing) {
        this.addGame({ ...updated, occupied_points: existing.occupied_points } as BoardPosition, true);
      }
      return updated;
    },
  },
});
