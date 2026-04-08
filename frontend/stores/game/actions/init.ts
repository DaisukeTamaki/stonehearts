import type { GameStoreThis } from "../types";
import type { GameMetaCreate, GameMetaUpdate, MoveModel } from "~/types/apiGameTypes";
import type { GoBoardSizeType } from "~/types/goTypes";
import * as gameService from "~/services/gameService";
import { watch, onUnmounted } from "vue";
import type { UUID } from "crypto";

export const gameInitActions = {
  async initializeGame(this: GameStoreThis, gameMeta: GameMetaCreate): Promise<boolean> {
    this.loading = true;
    this.error = null;
    try {
      const game = await gameService.createGame(gameMeta);
      this.gameId = game.game_id;
      this.boardSize = gameMeta.board_size as GoBoardSizeType;
      this.gameReadWithAnalysis = {
        ...game,
        moves: game.moves.map((m) => ({ ...m, analysis: undefined })) as MoveModel[],
      };
      this.currentMoveIndex = 0;
      this.gameHistory = [this._createInitialHistoryEntry(gameMeta.board_size as GoBoardSizeType)];
      this.initializeWatchers();
      this.initializeWebSocket();
      this.initializeFromUrl();
      this.registerKeyboardHandlers();
      return true;
    } catch (error) {
      this.error = "Failed to initialize game";
      console.error(error);
      return false;
    } finally {
      this.loading = false;
    }
  },

  async loadGame(this: GameStoreThis, gameId: UUID): Promise<void> {
    if (this.websocket) this.websocket.close();
    this.loading = true;
    this.error = null;
    try {
      const game = await gameService.getGame(gameId);
      const regularMoves = game.moves.filter((m) => !m.is_initial);
      this.gameId = gameId;
      this.boardSize = game.board_size as GoBoardSizeType;
      this.gameReadWithAnalysis = game;
      this.regularMoves = regularMoves;
      this.currentMoveIndex = regularMoves.length;
      this.gameHistory = this._reconstructGameHistory(game);
      this.initializeWatchers();
      this.initializeWebSocket();
      this.initializeFromUrl();
      this.registerKeyboardHandlers();
      await this.analyzeCurrentMove();
    } catch (error) {
      this.error = `Failed to load game ${gameId}`;
      console.error(error);
    } finally {
      this.loading = false;
    }
  },

  initializeWatchers(this: GameStoreThis): void {
    watch(
      () => this.error,
      (err) => { if (err) console.error("Game error:", err); },
    );
  },

  registerKeyboardHandlers(this: GameStoreThis): void {
    if (typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => this.navigateByKeyboard(e);
    window.addEventListener("keydown", handler);
    onUnmounted(() => window.removeEventListener("keydown", handler));
  },

  async updateGameMeta(this: GameStoreThis, gameId: UUID, gameMeta: GameMetaUpdate): Promise<void> {
    const updated = await gameService.updateGame(gameId, gameMeta);
    this.gameReadWithAnalysis = { ...this.gameReadWithAnalysis!, ...updated };
  },

  cleanup(this: GameStoreThis): void {
    if (this.websocket) { this.websocket.close(); this.websocket = null; }
    if (this.websocketReconnectTimer) { clearTimeout(this.websocketReconnectTimer); this.websocketReconnectTimer = null; }
    this.$reset();
  },
} as const;
