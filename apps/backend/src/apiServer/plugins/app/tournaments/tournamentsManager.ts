import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    tournamentsManager: ReturnType<typeof createTournamentsManager>;
  }
}

export type Player = {
  userId: number;
  alias: string;
};

export type Tournament = {
  id: string;
  name: string;
  hostId: number;
  maxPlayers: number;
  players: Player[];
  status: "waiting" | "ready" | "in_progress" | "completed";
  createdAt: Date;
};

export function createTournamentsManager(_fastify: FastifyInstance) {
  const tournaments = new Map<string, Tournament>();

  return {
    /**
     * トーナメントを作成
     * @param name トーナメント名
     * @param hostId ホストのユーザーID
     * @param maxPlayers 最大プレイヤー数
     * @returns 作成されたトーナメント
     */
    createTournament(
      name: string,
      hostId: number,
      maxPlayers: number = 4,
    ): Tournament {
      const tournament: Tournament = {
        id: randomUUID(),
        name,
        hostId,
        maxPlayers,
        players: [],
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
     * プレイヤーをトーナメントに参加させる
     * @param tournamentId トーナメントID
     * @param userId ユーザーID
     * @param alias プレイヤーのエイリアス名
     * @returns 成功した場合true、トーナメントが存在しないか満員の場合false
     */
    joinTournament(
      tournamentId: string,
      userId: number,
      alias: string,
    ): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return false;
      if (tournament.players.length >= tournament.maxPlayers) return false;
      if (tournament.players.some((p) => p.userId === userId)) return false;

      tournament.players.push({ userId, alias });
      if (tournament.players.length >= tournament.maxPlayers) {
        tournament.status = "ready";
      }
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
     * トーナメントを開始する
     * @param tournamentId トーナメントID
     * @param userId 開始を要求したユーザーID
     * @returns 成功した場合true、ホストでない場合や準備不足の場合false
     */
    startTournament(tournamentId: string, userId: number): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return false;
      if (tournament.hostId !== userId) return false;
      if (tournament.players.length < 4) return false;

      tournament.status = "in_progress";
      return true;
    },
  };
}

export default fp(async (fastify) => {
  fastify.decorate("tournamentsManager", createTournamentsManager(fastify));
});
