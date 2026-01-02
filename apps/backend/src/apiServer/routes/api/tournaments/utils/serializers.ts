import type {
  Match,
  Tournament,
} from "../../../../plugins/app/tournaments/types.js";

/** APIレスポンス用のトーナメント型 */
export type TournamentResponse = {
  id: string;
  name: string;
  hostId: number;
  maxPlayers: number;
  players: { userId: number; alias: string }[];
  status: "waiting" | "ready" | "in_progress" | "completed";
  createdAt: string;
  gameOptions: { ballSpeed: number; ballRadius: number };
};

/** APIレスポンス用のトーナメント一覧アイテム型 */
export type TournamentListItemResponse = {
  id: string;
  name: string;
  hostId: number;
  maxPlayers: number;
  currentPlayers: number;
  status: "waiting" | "ready" | "in_progress" | "completed";
  createdAt: string;
};

/**
 * TournamentオブジェクトをAPIレスポンス形式に変換
 */
export function serializeTournament(
  tournament: Tournament,
): TournamentResponse {
  return {
    id: tournament.id,
    name: tournament.name,
    hostId: tournament.hostId,
    maxPlayers: tournament.maxPlayers,
    players: tournament.players,
    status: tournament.status,
    createdAt: tournament.createdAt.toISOString(),
    gameOptions: tournament.gameOptions,
  };
}

/**
 * Tournamentオブジェクトを一覧用レスポンス形式に変換
 */
export function serializeTournamentListItem(
  tournament: Tournament,
): TournamentListItemResponse {
  return {
    id: tournament.id,
    name: tournament.name,
    hostId: tournament.hostId,
    maxPlayers: tournament.maxPlayers,
    currentPlayers: tournament.players.length,
    status: tournament.status,
    createdAt: tournament.createdAt.toISOString(),
  };
}

/**
 * Matchオブジェクトは既にAPIレスポンス形式と互換性があるため、
 * 必要に応じて追加のシリアライズ関数を定義
 */
export function serializeMatch(match: Match): Match {
  return match;
}
