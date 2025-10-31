import type { GameOptions, Match, Tournament } from "./types";

/**
 * トーナメント情報を取得
 */
export async function fetchTournament(
  tournamentId: string,
): Promise<Tournament> {
  const response = await fetch(`/api/tournaments/${tournamentId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch tournament");
  }
  return await response.json();
}

/**
 * マッチ一覧を取得
 */
export async function fetchMatches(tournamentId: string): Promise<Match[]> {
  const response = await fetch(`/api/tournaments/${tournamentId}/matches`);
  if (!response.ok) {
    throw new Error("Failed to fetch matches");
  }
  const data = await response.json();
  return data.matches || [];
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
 * マッチ結果を送信
 */
export async function submitMatchResult(
  tournamentId: string,
  matchId: string,
  winnerId: number,
  score: { leftPlayer: number; rightPlayer: number },
): Promise<void> {
  const response = await fetch(
    `/api/tournaments/${tournamentId}/matches/${matchId}/result`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ winnerId, score }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit match result");
  }
}

/**
 * トーナメント一覧を取得
 */
export async function fetchAllTournaments(): Promise<Tournament[]> {
  const response = await fetch("/api/tournaments");
  if (!response.ok) {
    throw new Error("Failed to fetch tournaments");
  }
  return await response.json();
}

/**
 * トーナメントを作成
 */
export async function createTournament(
  name: string,
  gameOptions: GameOptions,
): Promise<Tournament> {
  const response = await fetch("/api/tournaments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name, gameOptions }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create tournament");
  }

  return await response.json();
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

/**
 * 現在のユーザー情報を取得
 */
export async function getCurrentUser(): Promise<{
  id: number;
  name: string;
  email: string;
  ft_id: number;
}> {
  const response = await fetch("/api/user/me", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return await response.json();
}
