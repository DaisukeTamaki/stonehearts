import type { GameState } from "~/types/goTypes";
import type {
  AiAnalysisResponse,
  GameMetaBase,
  GameReadWithAnalysis,
} from "~/types/apiGameTypes";
import { Color } from "~/types/apiGameTypes";
import type { BranchType, GoBoardSizeType, GoCandidateMoveType, GoStoneType } from "~/types/goTypes";
import type { UUID } from "crypto";
import { boardService } from "~/services/boardService";

export const gameGetters = {
  getGame: (state: GameState): GameReadWithAnalysis | null => state.gameReadWithAnalysis,
  getGameId: (state: GameState): UUID | null => state.gameId,

  getGameInfo: (state: GameState): GameMetaBase | null => {
    const g = state.gameReadWithAnalysis;
    if (!g) return null;
    return {
      game_name: g.game_name, player_black: g.player_black, player_white: g.player_white,
      board_size: g.board_size, komi: g.komi, rules: g.rules,
      game_date: g.game_date, winner: g.winner, end_condition: g.end_condition,
      score_difference: g.score_difference, is_draft: g.is_draft,
    };
  },

  getBoardSize: (state: GameState): GoBoardSizeType => state.boardSize,
  getKomi: (state: GameState): number => state.gameReadWithAnalysis?.komi ?? 6.5,
  getPlayerBlack: (state: GameState): string => state.gameReadWithAnalysis?.player_black ?? "",
  getPlayerWhite: (state: GameState): string => state.gameReadWithAnalysis?.player_white ?? "",
  getCurrentMoveIndex: (state: GameState): number => state.currentMoveIndex,

  getCurrentPlayer(state: GameState): Color {
    if (state.currentMoveIndex === 0) {
      const initialStones = state.gameHistory[0]?.stones ?? [];
      return initialStones.length > 0 ? Color.White : Color.Black;
    }
    const prev = state.regularMoves[state.currentMoveIndex - 1];
    return prev?.color === Color.Black ? Color.White : Color.Black;
  },

  getCurrentStones: (state: GameState): GoStoneType[] =>
    state.gameHistory[state.currentMoveIndex]?.stones ?? [],

  getCurrentCandidateMoves: (state: GameState): GoCandidateMoveType[] => {
    if (state.isPvMode && state.pvBackup) {
      return state.pvBackup.gameHistory[state.pvBackup.currentMoveIndex]?.candidateMoves ?? [];
    }
    return state.gameHistory[state.currentMoveIndex]?.candidateMoves ?? [];
  },

  getCurrentMoveId: (state: GameState): UUID | null =>
    state.regularMoves?.[state.currentMoveIndex - 1]?.move_id ?? null,

  isLastMove: (state: GameState): boolean =>
    state.currentMoveIndex === state.gameHistory.length - 1,

  getCurrentAnalysis(state: GameState): AiAnalysisResponse | null {
    const idx = state.isPvMode
      ? (state.pvBackup?.currentMoveIndex ?? state.currentMoveIndex)
      : state.currentMoveIndex;
    if (idx === 0) return state.initialAnalysis;
    return state.regularMoves?.[idx - 1]?.analysis ?? null;
  },

  getCurrentBlackCaptureCount: (state: GameState): number => {
    const board = state.gameHistory[state.currentMoveIndex]?.board;
    return board ? boardService.getCaptureCount(board, Color.Black) : 0;
  },

  getCurrentWhiteCaptureCount: (state: GameState): number => {
    const board = state.gameHistory[state.currentMoveIndex]?.board;
    return board ? boardService.getCaptureCount(board, Color.White) : 0;
  },

  getCurrentBlackWinRate: (state: GameState): number | undefined =>
    state.gameHistory[state.currentMoveIndex]?.blackWinRate,

  getCurrentVisits: (state: GameState): number | undefined =>
    state.gameHistory[state.currentMoveIndex]?.visits,

  getTotalMoves: (state: GameState): number => state.gameHistory.length - 1,

  getBlackWinRateSeries: (state: GameState): number[] => {
    const history = state.isPvMode && state.pvBackup ? state.pvBackup.gameHistory : state.gameHistory;
    return history.map((e) => parseFloat(((e.blackWinRate ?? 0) * 100).toFixed(1)));
  },

  getBlackScoreLeadSeries: (state: GameState): number[] => {
    const history = state.isPvMode && state.pvBackup ? state.pvBackup.gameHistory : state.gameHistory;
    return history.map((e) => parseFloat((e.blackScoreLead ?? 0).toFixed(1)));
  },

  getCurrentBranchType: (state: GameState): BranchType => (state.backup ? "variation" : "main"),
  isRestoreGameDisabled: (state: GameState): boolean => state.isPvMode || !state.backup,
  isSetAsMainDisabled: (state: GameState): boolean =>
    state.isPvMode || !state.backup || !state.gameReadWithAnalysis?.is_draft,

  isNavigateToStartDisabled: (state: GameState): boolean => state.currentMoveIndex === 0,
  isNavigateBackward10Disabled: (state: GameState): boolean => state.currentMoveIndex < 10,
  isNavigateBackwardDisabled: (state: GameState): boolean => state.currentMoveIndex === 0,
  isNavigateForwardDisabled: (state: GameState): boolean =>
    state.currentMoveIndex === state.gameHistory.length - 1,
  isNavigateForward10Disabled: (state: GameState): boolean =>
    state.currentMoveIndex + 10 > state.gameHistory.length - 1,
  isNavigateToEndDisabled: (state: GameState): boolean =>
    state.currentMoveIndex === state.gameHistory.length - 1,
  isDeleteMoveDisabled: (state: GameState): boolean => state.isPvMode || state.currentMoveIndex === 0,

  isLoading: (state: GameState): boolean => state.loading,
  getError: (state: GameState): string | null => state.error,

  getAnalysisForMove: (state: GameState) => (moveNumber: number): AiAnalysisResponse | null => {
    if (moveNumber === 0) return state.initialAnalysis;
    return state.regularMoves?.[moveNumber - 1]?.analysis ?? null;
  },
} as const;
