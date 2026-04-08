import type Board from "@sabaki/go-board";
import type {
  AiAnalysisResponse,
  BoardPosition,
  Color,
  GameReadWithAnalysis,
  MoveModel,
} from "./apiGameTypes";
import type { UUID } from "crypto";

export type GoBoardSizeType = 9 | 13 | 19;

export interface GoCoordinateType {
  x: number;
  y: number;
}

export interface GoStoneType {
  x: number;
  y: number;
  color: Color;
  turnNumber?: number;
  isLastMove?: boolean;
}

export type GoSignType = -1 | 0 | 1;

export interface GoCandidateMoveType {
  x: number;
  y: number;
  rank: number;
  pv: string[];
}

export interface GameHistoryEntry {
  board: Board;
  stones: GoStoneType[];
  candidateMoves: GoCandidateMoveType[];
  blackWinRate?: number;
  blackScoreLead?: number;
  scoreStdev?: number;
  visits?: number;
}

export interface GameState {
  gameId: UUID | null;
  boardSize: GoBoardSizeType;
  gameReadWithAnalysis: GameReadWithAnalysis | null;
  initialAnalysis: AiAnalysisResponse | null;
  currentMoveIndex: number;
  gameHistory: GameHistoryEntry[];
  backup: {
    gameHistory: GameHistoryEntry[];
    gameReadWithAnalysis: GameReadWithAnalysis;
    currentMoveIndex: number;
  } | null;
  pvBackup: {
    gameHistory: GameHistoryEntry[];
    currentMoveIndex: number;
  } | null;
  isPvMode: boolean;
  selectedCandidateRank: number | null;
  loading: boolean;
  error: string | null;
  websocket: WebSocket | null;
  lastQueryId: string | null;
  websocketRetryCount: number;
  maxWebsocketRetries: number;
  websocketReconnectTimer: ReturnType<typeof setTimeout> | null;
  regularMoves: MoveModel[];
}

export interface GameListState {
  games: Record<string, BoardPosition>;
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
}

export type BranchType = "main" | "variation";
