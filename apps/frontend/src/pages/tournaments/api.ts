import {
  CreateTournamentResponseSchema,
  type GameOptions,
  type Match,
  type Tournament,
  type TournamentListItem,
  TournamentListResponseSchema,
  TournamentMatchesResponseSchema,
  TournamentSchema,
} from "@transcendence/shared";
import { fetchAndParse } from "@/utils";

/**
 * トーナメント情報を取得
 */
export async function fetchTournament(
  tournamentId: string,
): Promise<Tournament> {
  return await fetchAndParse(
    `/api/tournaments/${tournamentId}`,
    TournamentSchema,
    { credentials: "include" },
  );
}

/**
 * マッチ一覧を取得
 */
export async function fetchMatches(tournamentId: string): Promise<Match[]> {
  const data = await fetchAndParse(
    `/api/tournaments/${tournamentId}/matches`,
    TournamentMatchesResponseSchema,
    { credentials: "include" },
  );
  return data.matches;
}

/**
 * マッチを開始
 */
export async function startMatch(
  tournamentId: string,
  matchId: string,
): Promise<void> {
  const response = await fetch(
    `/api/tournaments/${tournamentId}/matches/${matchId}/start`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start match");
  }
}

/**
 * トーナメント一覧を取得
 */
export async function fetchAllTournaments(): Promise<TournamentListItem[]> {
  return await fetchAndParse("/api/tournaments", TournamentListResponseSchema, {
    credentials: "include",
  });
}

/**
 * トーナメントを作成
 */
export async function createTournament(
  name: string,
  gameOptions: GameOptions,
): Promise<string> {
  const data = await fetchAndParse(
    "/api/tournaments",
    CreateTournamentResponseSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, gameOptions }),
    },
  );
  return data.tournamentId;
}

/**
 * トーナメントに参加
 */
export async function joinTournament(
  tournamentId: string,
  alias: string,
): Promise<void> {
  const response = await fetch(`/api/tournaments/${tournamentId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ alias }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to join tournament");
  }
}

/**
 * トーナメント参加をキャンセル
 */
export async function cancelJoinTournament(
  tournamentId: string,
): Promise<void> {
  const response = await fetch(`/api/tournaments/${tournamentId}/cancel`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel join tournament");
  }
}

/**
 * トーナメントを開始
 */
export async function startTournament(tournamentId: string): Promise<void> {
  const response = await fetch(`/api/tournaments/${tournamentId}/start`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start tournament");
  }
}
