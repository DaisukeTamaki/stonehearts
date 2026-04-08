import type { UUID } from "crypto";
import type { GoBoardSizeType } from "@/types/goTypes";

export enum Color {
  Black = "black",
  White = "white",
}

export enum Winner {
  Black = "black",
  White = "white",
  Draw = "draw",
}

export enum EndCondition {
  Resignation = "resignation",
  Time = "time",
  Score = "score",
}

export enum Rules {
  Chinese = "chinese",
  Japanese = "japanese",
}

export interface GameMetaBase {
  player_black?: string | null;
  player_white?: string | null;
  board_size: GoBoardSizeType;
  komi: number;
  handicap?: number | null;
  game_date?: string | null;
  rules?: Rules | null;
  winner?: Winner | null;
  end_condition?: EndCondition | null;
  score_difference?: number | null;
  game_name?: string | null;
  is_draft: boolean;
}

export interface GameWithID extends GameMetaBase {
  game_id: UUID;
}

export interface MoveBase {
  turn_number: number;
  color: Color;
  x: number;
  y: number;
  is_initial: boolean;
  is_variation: boolean;
}

export type GameMetaCreate = GameMetaBase & { is_anonymous?: boolean };
export type GameMetaUpdate = Partial<GameMetaBase>;

export interface Move extends MoveBase {
  move_id: UUID;
  game_id: UUID;
}

export type MoveCreate = MoveBase;

export interface GameRead extends GameWithID {
  moves: Move[];
}

export interface MoveModel extends Move {
  analysis?: AiAnalysisResponse;
}

export interface GameReadWithAnalysis extends GameWithID {
  moves: MoveModel[];
}

export interface GameStone {
  x: number;
  y: number;
  color: Color;
}

export interface BoardPosition extends GameWithID {
  occupied_points: GameStone[];
}

export interface AnalyzeRequest {
  query_id: string;
  game_id: UUID;
  move_ids?: UUID[];
  max_visits?: number;
  action?: "terminate";
  terminate_id?: string;
}

export interface MoveInfo {
  lcb: number;
  move: string;
  order: number;
  prior: number;
  pv: string[];
  scoreLead: number;
  scoreMean: number;
  scoreSelfplay: number;
  scoreStdev: number;
  utility: number;
  utilityLcb: number;
  visits: number;
  winrate: number;
  isSymmetryOf?: string;
  ownership?: number[];
  ownershipStdev?: number[];
  pvVisits?: number[];
  pvEdgeVisits?: number[];
}

export interface RootInfo {
  currentPlayer: "B" | "W";
  lcb: number;
  scoreLead: number;
  scoreSelfplay: number;
  scoreStdev: number;
  symHash: string;
  thisHash: string;
  utility: number;
  visits: number;
  winrate: number;
  rawStWrError?: number;
  rawStScoreError?: number;
  rawVarTimeLeft?: number;
  ownership?: number[];
  ownershipStdev?: number[];
  policy?: number[];
}

export interface AiAnalysisResponse {
  id: string;
  isDuringSearch: boolean;
  moveInfos: MoveInfo[];
  rootInfo: RootInfo;
  turnNumber: number;
}

export const DEFAULT_BOARD_SIZE: GoBoardSizeType = 19;
export const DEFAULT_KOMI = 6.5;
