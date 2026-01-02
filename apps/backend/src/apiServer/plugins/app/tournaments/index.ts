import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { MEMORY_RETENTION_MS } from "./constants.js";
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
  // ===================
  // 初期化
  // ===================

  const tournaments = new Map<string, Tournament>();
  const tournamentManager = createTournamentManager(tournaments);
  const matchManager = createMatchManager(tournaments);
  const repository = createTournamentRepository(fastify.db);

  /** トーナメントが完了しているか判定 */
  function isTournamentCompleted(matches: Match[]): boolean {
    const finalsMatch = matches.find((m) => m.round === "finals");
    const thirdPlaceMatch = matches.find((m) => m.round === "third_place");

    return (
      finalsMatch?.status === "completed" &&
      thirdPlaceMatch?.status === "completed"
    );
  }

  /** 優勝者を取得（決勝戦の勝者） */
  function getChampion(matches: Match[]): number | null {
    const finalsMatch = matches.find((m) => m.round === "finals");
    if (!finalsMatch || !finalsMatch.score) {
      return null;
    }

    return finalsMatch.score.leftPlayer > finalsMatch.score.rightPlayer
      ? finalsMatch.leftPlayer.userId
      : finalsMatch.rightPlayer.userId;
  }

  // ===================
  // 公開API
  // ===================

  return {
    // --- トーナメント基本操作 ---
    createTournament: tournamentManager.createTournament,
    getTournament: tournamentManager.getTournament,
    getAllTournaments: tournamentManager.getAllTournaments,
    joinTournament: tournamentManager.joinTournament,
    isReady: tournamentManager.isReady,
    deleteTournament: tournamentManager.deleteTournament,
    cancelJoinTournament: tournamentManager.cancelJoinTournament,

    // --- マッチ基本操作 ---
    generateMatches: matchManager.generateMatches,
    getMatches: matchManager.getMatches,
    startMatch: matchManager.startMatch,

    // --- トーナメント進行 ---
    /** トーナメント開始（ホストのみ、4人必要） */
    startTournament(tournamentId: string, userId: number): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return false;
      if (tournament.hostId !== userId) return false;
      if (tournament.players.length < 4) return false;

      tournament.status = "in_progress";
      matchManager.generateMatches(tournamentId);
      return true;
    },

    /** 試合結果を登録 + トーナメント完了時にDB保存 */
    submitMatchResult(
      tournamentId: string,
      matchId: string,
      winnerId: number,
      score: { leftPlayer: number; rightPlayer: number },
    ): Match | undefined {
      const match = matchManager.submitMatchResult(
        tournamentId,
        matchId,
        winnerId,
        score,
      );

      if (!match) {
        return undefined;
      }

      const tournament = tournaments.get(tournamentId);
      if (!tournament) {
        return match;
      }

      // トーナメント完了時の処理
      if (isTournamentCompleted(tournament.matches)) {
        tournament.status = "completed";
        const championId = getChampion(tournament.matches);

        repository
          .saveTournamentWithMatches(tournament, championId)
          .then(() => {
            // DB保存成功後、一定時間後にメモリから削除
            setTimeout(() => {
              tournaments.delete(tournamentId);
            }, MEMORY_RETENTION_MS);
          })
          .catch((error) => {
            console.error(
              `Failed to save tournament ${tournamentId} to database:`,
              error,
            );
          });
      }

      return match;
    },
  };
}

// ===================
// プラグイン登録
// ===================

/**
 * Fastifyプラグインとして登録
 * fastify.tournamentsManager で各ルートからアクセス可能になる
 */
export default fp(async (fastify) => {
  fastify.decorate("tournamentsManager", createTournamentsManager(fastify));
});
