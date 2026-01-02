import { v7 as uuidv7 } from "uuid";
import { MAX_PLAYERS } from "../constants.js";
import type { GameOptions, Tournament } from "../types.js";

/**
 * トーナメント基本操作マネージャー
 * - 作成・取得・削除
 * - プレイヤー参加管理
 */
export function createTournamentManager(tournaments: Map<string, Tournament>) {
  return {
    // ===================
    // トーナメント操作
    // ===================

    /** トーナメントを作成 */
    createTournament(
      name: string,
      hostId: number,
      gameOptions: GameOptions,
      maxPlayers: number = MAX_PLAYERS,
    ): Tournament {
      const tournament: Tournament = {
        id: uuidv7(),
        name,
        hostId,
        maxPlayers,
        players: [],
        status: "waiting",
        matches: [],
        createdAt: new Date(),
        gameOptions,
      };
      tournaments.set(tournament.id, tournament);
      return tournament;
    },

    /** トーナメントを取得 */
    getTournament(tournamentId: string): Tournament | undefined {
      return tournaments.get(tournamentId);
    },

    /** 全トーナメントを取得 */
    getAllTournaments(): Tournament[] {
      return Array.from(tournaments.values());
    },

    /** トーナメントを削除 */
    deleteTournament(tournamentId: string): boolean {
      return tournaments.delete(tournamentId);
    },

    // ===================
    // プレイヤー参加管理
    // ===================

    /** プレイヤーをトーナメントに参加させる */
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

    /** トーナメントが準備完了状態かチェック */
    isReady(tournamentId: string): boolean {
      const tournament = tournaments.get(tournamentId);
      return tournament?.status === "ready";
    },

    /** トーナメントへの参加をキャンセル */
    cancelJoinTournament(tournamentId: string, userId: number): boolean {
      const tournament = tournaments.get(tournamentId);
      if (!tournament) return false;

      const playerIndex = tournament.players.findIndex(
        (p) => p.userId === userId,
      );
      if (playerIndex === -1) return false;

      tournament.players.splice(playerIndex, 1);

      // ステータスを更新
      if (
        tournament.status === "ready" &&
        tournament.players.length < tournament.maxPlayers
      ) {
        tournament.status = "waiting";
      }

      return true;
    },
  };
}
