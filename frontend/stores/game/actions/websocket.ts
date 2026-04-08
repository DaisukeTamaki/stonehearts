import { useAuthStore } from "@/stores/authStore";
import { useRuntimeConfig } from "#app";
import { useWebSocket } from "@vueuse/core";
import { watch } from "vue";
import type { GameStoreThis } from "../types";
import type { AiAnalysisResponse, AnalyzeRequest } from "~/types/apiGameTypes";
import { GAME_CONSTANTS } from "../constants";

export const gameWebSocketActions = {
  initializeWebSocket(this: GameStoreThis): void {
    try {
      if (this.websocket?.status === "OPEN") return;
      this.cleanupWebSocket(false);

      const authStore = useAuthStore();
      const config = useRuntimeConfig();
      const params = new URLSearchParams();
      if (this.gameId) params.append("game_id", this.gameId);
      if (authStore.tokenString) params.append("token", authStore.tokenString);

      let wsUrl = `${config.public.apiBaseUrl}/ws/analyze`;
      if (params.toString()) wsUrl += `?${params.toString()}`;

      const { send, close, status } = useWebSocket(wsUrl, {
        autoReconnect: {
          retries: GAME_CONSTANTS.MAX_RETRIES,
          delay: GAME_CONSTANTS.BASE_RETRY_DELAY,
          onFailed: () => { this.error = "Unable to maintain connection. Please refresh the page."; },
        },
        heartbeat: {
          message: "ping",
          interval: GAME_CONSTANTS.HEARTBEAT_INTERVAL,
          pongTimeout: GAME_CONSTANTS.PONG_TIMEOUT,
        },
        onMessage: (_ws, event) => this.handleWebSocketMessage(event),
        onError: (_ws, event) => this.handleWebSocketError(event),
        onDisconnected: (_ws, event) => this.handleWebSocketDisconnect(event),
        immediate: true,
      });

      this.websocket = { send, close, status };
      watch(status, (s) => { if (s === "OPEN") { this.websocketRetryCount = 0; this.error = null; } });
    } catch {
      this.error = "Failed to initialize connection";
      this.handleConnectionFailure();
    }
  },

  handleWebSocketMessage(this: GameStoreThis, event: MessageEvent): void {
    if (event.data === "pong") return;
    try {
      const analysis = JSON.parse(event.data) as AiAnalysisResponse;
      if (analysis.id !== this.lastQueryId) return;
      this._setAnalysis(analysis);
      if (!analysis.isDuringSearch) this.lastQueryId = null;
    } catch {
      this.error = "Error processing analysis data";
    }
  },

  handleWebSocketError(this: GameStoreThis, _event: Event): void {
    this.error = "Connection error occurred";
  },

  handleWebSocketDisconnect(this: GameStoreThis, event: CloseEvent): void {
    if (event.code === 1008) this.error = event.reason || "Access denied";
    else if (event.code === 1006) this.error = "Connection lost unexpectedly";
    else if (event.code === 1011) this.error = "Server error occurred";
    this.handleConnectionFailure();
  },

  handleConnectionFailure(this: GameStoreThis): void {
    if (this.websocketRetryCount >= GAME_CONSTANTS.MAX_RETRIES) {
      this.error = "Unable to maintain connection. Please refresh the page.";
      return;
    }
    this.websocketRetryCount++;
  },

  terminateAnalysis(this: GameStoreThis): void {
    if (!this.gameId || !this.lastQueryId || !this.websocket?.send) return;
    const req: AnalyzeRequest = { query_id: this.lastQueryId, game_id: this.gameId, action: "terminate" };
    this.websocket.send(JSON.stringify(req));
  },

  cleanupWebSocket(this: GameStoreThis, fullReset: boolean = true): void {
    if (this.websocket) { try { this.websocket.close(); } catch {} this.websocket = null; }
    if (this.websocketReconnectTimer) { clearTimeout(this.websocketReconnectTimer); this.websocketReconnectTimer = null; }
    this.websocketRetryCount = 0;
    if (fullReset) this.$reset();
  },
} as const;
