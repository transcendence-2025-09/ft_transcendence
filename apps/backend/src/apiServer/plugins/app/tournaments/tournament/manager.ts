import { v7 as uuidv7 } from "uuid";
import type { GameOptions, Tournament } from "../types.js";

export function createTournamentManager(tournaments: Map<string, Tournament>) {
  return {
    /**
     * トーナメントを作成
     * @param name トーナメント名
     * @param hostId ホストのユーザーID
     * @param gameOptions ゲームオプション
     * @param maxPlayers 最大プレイヤー数
     * @returns 作成されたトーナメント
     */
    createTournament(
      name: string,
      hostId: number,
      gameOptions: GameOptions,
      maxPlayers: number = 4,
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
  };
}
