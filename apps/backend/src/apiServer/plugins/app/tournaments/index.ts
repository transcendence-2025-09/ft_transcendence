import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { createMatchManager } from "./match/manager.js";
import { createTournamentRepository } from "./repository.js";
import { createTournamentManager } from "./tournament/manager.js";
import type { Match, Tournament } from "./types.js";

declare module "fastify" {
  interface FastifyInstance {
    tournamentsManager: ReturnType<typeof createTournamentsManager>;
  }
}

/**
 * トーナメント管理システム
 * - トーナメントの作成・取得・削除
 * - プレイヤーの参加管理
 * - マッチの生成・進行・結果登録
 * - トーナメント完了時のDB保存
 */
export function createTournamentsManager(fastify: FastifyInstance) {
  // トーナメントストレージ（メモリ上のMap）
  const tournaments = new Map<string, Tournament>();

  // 各ManagerとRepositoryを初期化
  const tournamentManager = createTournamentManager(tournaments);
  const matchManager = createMatchManager(tournaments);
  const repository = createTournamentRepository(fastify.db);

  /**
   * トーナメントが完了しているか判定
   */
  function isTournamentCompleted(matches: Match[]): boolean {
    const finalsMatch = matches.find((m) => m.round === "finals");
    const thirdPlaceMatch = matches.find((m) => m.round === "third_place");

    return (
      finalsMatch?.status === "completed" &&
      thirdPlaceMatch?.status === "completed"
    );
  }

  /**
   * 優勝者を取得（決勝戦の勝者）
   */
  function getChampion(matches: Match[]): number | null {
    const finalsMatch = matches.find((m) => m.round === "finals");
    if (!finalsMatch || !finalsMatch.score) {
      return null;
    }

    return finalsMatch.score.leftPlayer > finalsMatch.score.rightPlayer
      ? finalsMatch.leftPlayer.userId
      : finalsMatch.rightPlayer.userId;
  }

  return {
    // トーナメント基本操作
    createTournament: tournamentManager.createTournament,
    getTournament: tournamentManager.getTournament,
    getAllTournaments: tournamentManager.getAllTournaments,
    joinTournament: tournamentManager.joinTournament,
    isReady: tournamentManager.isReady,
    deleteTournament: tournamentManager.deleteTournament,
    cancelJoinTournament: tournamentManager.cancelJoinTournament,

    /**
     * トーナメント開始（マッチ生成を含む）
     * - ホストのみ実行可能
     * - 4人揃っている必要がある
     * - セミファイナルマッチを自動生成
     */
    startTournament(tournamentId: string, userId: number): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return false;
      if (tournament.hostId !== userId) return false;
      if (tournament.players.length < 4) return false;

      tournament.status = "in_progress";
      matchManager.generateMatches(tournamentId);
      return true;
    },

    // マッチ基本操作
    generateMatches: matchManager.generateMatches,
    getMatches: matchManager.getMatches,
    startMatch: matchManager.startMatch,

    /**
     * 試合結果を登録 + トーナメント完了時にDB保存
     */
    submitMatchResult(
      tournamentId: string,
      matchId: string,
      winnerId: number,
      score: { leftPlayer: number; rightPlayer: number },
    ): Match | undefined {
      // 試合結果を登録
      const match = matchManager.submitMatchResult(
        tournamentId,
        matchId,
        winnerId,
        score,
      );

      if (!match) {
        return undefined;
      }

      // トーナメント完了チェック
      const tournament = tournaments.get(tournamentId);
      if (!tournament) {
        return match;
      }

      if (isTournamentCompleted(tournament.matches)) {
        // トーナメントステータスを更新
        tournament.status = "completed";

        // 優勝者を取得
        const championId = getChampion(tournament.matches);

        // DB保存
        repository
          .saveTournamentWithMatches(tournament, championId)
          .then(() => {
            // DB保存成功後、5分後にメモリから削除
            setTimeout(
              () => {
                tournaments.delete(tournamentId);
                console.log(
                  `🗑️ Tournament ${tournamentId} removed from memory after 5 minutes`,
                );
              },
              5 * 60 * 1000,
            ); // 5分 = 300,000ms
          })
          .catch((error) => {
            console.error(
              `❌ Failed to save tournament ${tournamentId} to database:`,
              error,
            );
          });
      }

      return match;
    },
  };
}

export default fp(async (fastify) => {
  fastify.decorate("tournamentsManager", createTournamentsManager(fastify));
});
