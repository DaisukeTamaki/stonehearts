import type { GameState } from "~/types/goTypes";

export const gameState = (): GameState => ({
  gameId: null,
  boardSize: 19,
  gameReadWithAnalysis: null,
  initialAnalysis: null,
  currentMoveIndex: 0,
  gameHistory: [],
  backup: null,
  pvBackup: null,
  isPvMode: false,
  selectedCandidateRank: null,
  loading: false,
  error: null,
  websocket: null,
  lastQueryId: null,
  websocketRetryCount: 0,
  maxWebsocketRetries: 3,
  websocketReconnectTimer: null,
  regularMoves: [],
});
