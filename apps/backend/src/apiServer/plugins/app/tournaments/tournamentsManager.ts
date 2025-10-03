import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { randomUUID } from "node:crypto";

declare module "fastify" {
  interface FastifyInstance {
    tournamentsManager: ReturnType<typeof createTournamentsManager>;
  }
}

export type Tournament = {
  id: string;
  maxPlayers: number;
  readyPlayers: Set<number>;
  status: "waiting" | "ready" | "in_progress" | "completed";
  createdAt: Date;
};

export function createTournamentsManager(_fastify: FastifyInstance) {
  const tournaments = new Map<string, Tournament>();

  return {
    /**
     * トーナメントを作成
     * @param maxPlayers 準備完了に必要なプレイヤー数
     * @returns 作成されたトーナメント
     */
    createTournament(maxPlayers: number): Tournament {
      const tournament: Tournament = {
        id: randomUUID(),
        maxPlayers,
        readyPlayers: new Set<number>(),
        status: "waiting",
        createdAt: new Date(),
      };
      tournaments.set(tournament.id, tournament);
      return tournament;
    },

    /**
     * トーナメントを取得
     * @param tournamentId トーナメントID
     * @returns トーナメント（存在しない場合はundefined）
     */
    getTournament(tournamentId: string): Tournament | undefined {
      return tournaments.get(tournamentId);
    },

    /**
     * 全トーナメントを取得
     * @returns 全トーナメントの配列
     */
    getAllTournaments(): Tournament[] {
      return Array.from(tournaments.values());
    },

    /**
     * プレイヤーを準備完了状態にする
     * n人揃った場合、自動的にstatusを'ready'に変更
     * @param tournamentId トーナメントID
     * @param userId ユーザーID
     * @returns 成功した場合true、トーナメントが存在しない場合false
     */
    addReadyPlayer(tournamentId: string, userId: number): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament)
        return false;
      tournament.readyPlayers.add(userId);
      if (tournament.readyPlayers.size >= tournament.maxPlayers)
        tournament.status = "ready";
      return true;
    },

    /**
     * トーナメントが準備完了状態かチェック
     * @param tournamentId トーナメントID
     * @returns 準備完了している場合true
     */
    isReady(tournamentId: string): boolean {
      const tournament = tournaments.get(tournamentId);
      return tournament?.status === "ready";
    },

    /**
     * トーナメントを削除
     * @param tournamentId トーナメントID
     * @returns 削除された場合true
     */
    deleteTournament(tournamentId: string): boolean {
      return tournaments.delete(tournamentId);
    },

    /**
     * プレイヤーの準備完了状態を解除
     * @param tournamentId トーナメントID
     * @param userId ユーザーID
     * @returns 成功した場合true
     */
    removeReadyPlayer(tournamentId: string, userId: number): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament)
        return false;
      const removed = tournament.readyPlayers.delete(userId);
      if (removed && tournament.status === "ready")
        tournament.status = "waiting";
      return removed;
    },
  };
}

export default fp(async (fastify) => {
  fastify.decorate("tournamentsManager", createTournamentsManager(fastify));
});
