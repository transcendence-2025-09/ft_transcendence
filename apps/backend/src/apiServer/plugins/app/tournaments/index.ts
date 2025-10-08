import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import type { Tournament } from "./types.js";
import { createTournamentManager } from "./tournament/manager.js";
import { createMatchManager } from "./match/manager.js";

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
 */
export function createTournamentsManager(fastify: FastifyInstance) {
  // トーナメントストレージ（メモリ上のMap）
  const tournaments = new Map<string, Tournament>();

  // 各マネージャーを初期化（同じストレージを共有）
  const tournamentManager = createTournamentManager(tournaments);
  const matchManager = createMatchManager(tournaments);

  return {
    // トーナメント基本操作
    createTournament: tournamentManager.createTournament,
    getTournament: tournamentManager.getTournament,
    getAllTournaments: tournamentManager.getAllTournaments,
    joinTournament: tournamentManager.joinTournament,
    isReady: tournamentManager.isReady,
    deleteTournament: tournamentManager.deleteTournament,

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

    // マッチ操作
    generateMatches: matchManager.generateMatches,
    getMatches: matchManager.getMatches,
    startMatch: matchManager.startMatch,
    submitMatchResult: matchManager.submitMatchResult,
  };
}

export default fp(async (fastify) => {
  fastify.decorate("tournamentsManager", createTournamentsManager(fastify));
});
