import type { GameStoreThis } from "../types";
import type { AiAnalysisResponse } from "~/types/apiGameTypes";
import type { GoStoneType } from "~/types/goTypes";
import { Color } from "~/types/apiGameTypes";
import { analysisService } from "~/services/analysisService";
import { GAME_CONSTANTS } from "../constants";
import type { UUID } from "crypto";
import { boardService } from "~/services/boardService";

export const gameAnalysisActions = {
  async analyzeCurrentMove(this: GameStoreThis): Promise<void> {
    if (!this.gameId) return;
    if (!this.websocket?.send || this.websocket.status === "CLOSED") return;

    if (this.getCurrentVisits && this.getCurrentVisits >= GAME_CONSTANTS.MAX_VISITS) return;

    this.terminatePreviousAnalysis();

    const moveIds: UUID[] = this.getCurrentMoveId ? [this.getCurrentMoveId] : [];
    const req = analysisService.createAnalyzeRequest(
      this.gameId, moveIds, this.getCurrentBranchType, GAME_CONSTANTS.MAX_VISITS,
    );
    this.websocket.send(JSON.stringify(req));
    this.lastQueryId = req.query_id;
  },

  terminatePreviousAnalysis(this: GameStoreThis): void {
    if (!this.gameId || !this.lastQueryId || !this.websocket?.send) return;
    const req = analysisService.createTerminateRequest(this.gameId, this.lastQueryId);
    this.websocket.send(JSON.stringify(req));
  },

  _setAnalysis(this: GameStoreThis, analysis: AiAnalysisResponse): void {
    if (!analysisService.validateAnalysisResponse(analysis)) return;
    const turn = analysis.turnNumber;

    if (turn === 0) {
      this.initialAnalysis = analysis;
    } else {
      if (!this.regularMoves[turn - 1]) return;
      this.regularMoves[turn - 1].analysis = analysis;
    }

    const entry = this.gameHistory[turn];
    if (!entry) return;
    entry.candidateMoves = analysisService.convertAnalysisToCandidateStones(analysis, this.boardSize);
    entry.blackWinRate = analysis.rootInfo.winrate;
    entry.blackScoreLead = analysis.rootInfo.scoreLead;
    entry.scoreStdev = analysis.rootInfo.scoreStdev;
    entry.visits = analysis.rootInfo.visits;
  },

  getPrincipalVariationStones(this: GameStoreThis, rank: number = 0): GoStoneType[][] {
    if (!this.gameId) return [];
    const candidates = this.getCurrentCandidateMoves;
    if (rank >= candidates.length) return [];

    let currentBoard = this.getCurrentBoardClone();
    let prevStones = [...this.getCurrentStones];
    const pvStones: GoStoneType[][] = [];
    let nextColor: Color = this.getCurrentPlayer;

    for (const pvMove of candidates[rank].pv) {
      const [x, y] = analysisService.parseMove(pvMove, this.boardSize);
      const sign = boardService.colorToSign(nextColor);
      const res = boardService.makeMove(currentBoard, { x, y }, sign);
      if (!res.success || !res.board) break;
      const newStones = boardService.getDiffStones(currentBoard, res.board, prevStones, pvStones.length + 1);
      pvStones.push(newStones);
      currentBoard = res.board;
      prevStones = newStones;
      nextColor = nextColor === Color.Black ? Color.White : Color.Black;
    }
    return pvStones;
  },
} as const;
