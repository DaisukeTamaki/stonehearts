import apiClient from "@/services/apiClient";
import type { UUID } from "crypto";
import type {
  GameMetaCreate,
  GameMetaUpdate,
  GameRead,
  GameReadWithAnalysis,
  GameWithID,
  Move,
  MoveCreate,
  BoardPosition,
} from "@/types/apiGameTypes";

export async function createGame(data: GameMetaCreate): Promise<GameRead> {
  const res = await apiClient.post<GameRead>("/games", data);
  return res.data;
}

export async function listGames(
  skip = 0,
  limit = 100,
  draft?: boolean,
): Promise<GameWithID[]> {
  const params: Record<string, unknown> = { skip, limit };
  if (draft !== undefined) params.draft = draft;
  const res = await apiClient.get<GameWithID[]>("/games", { params });
  return res.data;
}

export async function getGame(gameId: UUID): Promise<GameReadWithAnalysis> {
  const res = await apiClient.get<GameReadWithAnalysis>(`/games/${gameId}`);
  return res.data;
}

export async function updateGame(gameId: UUID, data: GameMetaUpdate): Promise<GameWithID> {
  const res = await apiClient.put<GameWithID>(`/games/${gameId}`, data);
  return res.data;
}

export async function deleteGame(gameId: UUID): Promise<void> {
  await apiClient.delete(`/games/${gameId}`);
}

export async function addMove(gameId: UUID, move: MoveCreate): Promise<Move> {
  const res = await apiClient.post<Move>(`/games/${gameId}/moves`, move);
  return res.data;
}

export async function updateMove(
  gameId: UUID,
  moveId: UUID,
  move: MoveCreate,
): Promise<Move> {
  const res = await apiClient.put<Move>(`/games/${gameId}/moves/${moveId}`, move);
  return res.data;
}

export async function deleteMove(gameId: UUID, moveId: UUID): Promise<void> {
  await apiClient.delete(`/games/${gameId}/moves/${moveId}`);
}

export async function createGameFromSgf(content: string): Promise<GameRead> {
  const res = await apiClient.post<GameRead>("/games/sgf", { content });
  return res.data;
}

export async function addVariation(gameId: UUID, move: MoveCreate): Promise<Move> {
  const res = await apiClient.put<Move>(`/games/${gameId}/variation`, move);
  return res.data;
}

export async function setVariationAsMain(gameId: UUID): Promise<boolean> {
  const res = await apiClient.put<boolean>(`/games/${gameId}/set-variation-as-main`);
  return res.data;
}

export async function clearVariations(gameId: UUID): Promise<void> {
  await apiClient.delete(`/games/${gameId}/clear-variations`);
}

export async function getBoardPositions(
  targetTurn: number,
  skip = 0,
  limit = 100,
  draft?: boolean,
): Promise<BoardPosition[]> {
  const params: Record<string, unknown> = { target_turn: targetTurn, skip, limit };
  if (draft !== undefined) params.draft = draft;
  const res = await apiClient.get<BoardPosition[]>("/games/board_positions", { params });
  return res.data;
}

export async function getBoardPosition(
  gameId: UUID,
  targetTurn: number,
): Promise<BoardPosition> {
  const res = await apiClient.get<BoardPosition>(
    `/games/board_position/${gameId}`,
    { params: { target_turn: targetTurn } },
  );
  return res.data;
}
