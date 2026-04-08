import { v4 as uuidv4 } from "uuid";
import type { UUID } from "crypto";
import type { AiAnalysisResponse, AnalyzeRequest } from "~/types/apiGameTypes";
import type { BranchType, GoBoardSizeType, GoCandidateMoveType } from "~/types/goTypes";
import { TOP_CANDIDATE_MOVES } from "~/constants/analysis";

class AnalysisService {
  private static instance: AnalysisService;
  static getInstance(): AnalysisService {
    if (!AnalysisService.instance) AnalysisService.instance = new AnalysisService();
    return AnalysisService.instance;
  }

  createAnalyzeRequest(
    gameId: UUID,
    moveIds: UUID[],
    branchType: BranchType,
    maxVisits: number,
  ): AnalyzeRequest {
    return {
      query_id: `${gameId}_${uuidv4()}_${branchType}`,
      game_id: gameId,
      move_ids: moveIds.length > 0 ? moveIds : undefined,
      max_visits: maxVisits,
    };
  }

  createTerminateRequest(gameId: UUID, queryId: string): AnalyzeRequest {
    return {
      query_id: queryId,
      game_id: gameId,
      action: "terminate",
      terminate_id: queryId,
    };
  }

  convertAnalysisToCandidateStones(
    analysis: AiAnalysisResponse,
    boardSize: GoBoardSizeType,
  ): GoCandidateMoveType[] {
    if (!analysis?.moveInfos) return [];
    return analysis.moveInfos.slice(0, TOP_CANDIDATE_MOVES).map((info, i) => {
      const [x, y] = this.parseMove(info.move, boardSize);
      return { x, y, rank: i, pv: info.pv };
    });
  }

  validateAnalysisResponse(analysis: AiAnalysisResponse): boolean {
    return !!(analysis && analysis.rootInfo && analysis.moveInfos);
  }

  parseMove(move: string, boardSize: number): [number, number] {
    let x = move.charCodeAt(0) - "A".charCodeAt(0);
    if (move[0] >= "I") x--;
    const y = boardSize - parseInt(move.slice(1));
    return [x, y];
  }
}

export const analysisService = AnalysisService.getInstance();
