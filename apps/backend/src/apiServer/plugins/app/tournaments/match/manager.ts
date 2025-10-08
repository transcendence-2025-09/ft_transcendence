import { randomUUID } from "node:crypto";
import type { Match, Tournament } from "../types.js";

export function createMatchManager(tournaments: Map<string, Tournament>) {
  return {
    /**
     * セミファイナルマッチを生成する
     * @param tournamentId トーナメントID
     * @returns 成功した場合true
     */
    generateMatches(tournamentId: string): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return false;
      if (tournament.players.length < 4) return false;

      // セミファイナル2試合を生成
      const match1: Match = {
        id: randomUUID(),
        round: "semifinals",
        player1: tournament.players[0],
        player2: tournament.players[1],
        status: "pending",
      };

      const match2: Match = {
        id: randomUUID(),
        round: "semifinals",
        player1: tournament.players[2],
        player2: tournament.players[3],
        status: "pending",
      };

      tournament.matches = [match1, match2];
      return true;
    },

    /**
     * マッチ一覧を取得
     * @param tournamentId トーナメントID
     * @returns マッチ配列（トーナメントが存在しない場合はundefined）
     */
    getMatches(tournamentId: string): Match[] | undefined {
      const tournament = tournaments.get(tournamentId);
      return tournament?.matches;
    },

    /**
     * マッチを開始する
     * @param tournamentId トーナメントID
     * @param matchId マッチID
     * @returns 成功した場合true
     */
    startMatch(tournamentId: string, matchId: string): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return false;

      const match = tournament.matches.find((m) => m.id === matchId);
      if (!match) return false;
      if (match.status !== "pending") return false;

      match.status = "in_progress";
      return true;
    },

    /**
     * 試合結果を登録する
     * @param tournamentId トーナメントID
     * @param matchId マッチID
     * @param winnerId 勝者のユーザーID
     * @param score スコア
     * @returns 更新されたマッチ（失敗した場合はundefined）
     */
    submitMatchResult(
      tournamentId: string,
      matchId: string,
      winnerId: number,
      score: { player1: number; player2: number },
    ): Match | undefined {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return undefined;

      const match = tournament.matches.find((m) => m.id === matchId);
      if (!match) return undefined;
      if (match.status !== "in_progress") return undefined;

      // 勝者がマッチの参加者であることを確認
      const isValidWinner =
        match.player1.userId === winnerId || match.player2.userId === winnerId;
      if (!isValidWinner) return undefined;

      match.score = score;
      match.status = "completed";

      return match;
    },
  };
}
