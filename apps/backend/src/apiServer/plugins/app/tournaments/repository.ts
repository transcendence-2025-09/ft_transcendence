import type { Database } from "sqlite";
import type { Tournament } from "./types.js";

/**
 * トーナメント結果をDBに保存するRepository
 */
export function createTournamentRepository(db: Database) {
  /**
   * ラウンド名を数値に変換
   * semifinals = 1, third_place = 2, finals = 3
   */
  function getRoundNumber(
    round: "semifinals" | "finals" | "third_place",
  ): number {
    const roundMap: Record<string, number> = {
      semifinals: 1,
      third_place: 2,
      finals: 3,
    };
    return roundMap[round] || 0;
  }

  return {
    /**
     * トーナメント全体をDBに保存（トランザクション）
     * @param tournament トーナメント情報
     * @param winnerId 優勝者のユーザーID
     */
    async saveTournamentWithMatches(
      tournament: Tournament,
      winnerId: number | null,
    ): Promise<void> {
      try {
        await db.run("BEGIN TRANSACTION");

        // tournaments テーブルに保存
        await db.run(
          `INSERT INTO tournaments (id, name, host_id, winner_id, created_at)
           VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
           ON CONFLICT(id) DO UPDATE SET winner_id = ?`,
          [
            tournament.id,
            tournament.name,
            tournament.hostId,
            winnerId,
            winnerId,
          ],
        );

        // 完了した試合のみ matches テーブルに保存
        for (const match of tournament.matches) {
          if (match.status !== "completed" || !match.score) {
            continue;
          }

          const roundNumber = getRoundNumber(match.round);

          // 勝者を判定
          const matchWinnerId =
            match.score.leftPlayer > match.score.rightPlayer
              ? match.leftPlayer.userId
              : match.rightPlayer.userId;

          await db.run(
            `INSERT INTO matches (id, tournament_id, round, player1_id, player2_id, player1_score, player2_score, winner_id, played_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
             ON CONFLICT(id) DO UPDATE SET
               player1_score = ?,
               player2_score = ?,
               winner_id = ?`,
            [
              match.id,
              tournament.id,
              roundNumber,
              match.leftPlayer.userId,
              match.rightPlayer.userId,
              match.score.leftPlayer,
              match.score.rightPlayer,
              matchWinnerId,
              // UPDATE用のパラメータ
              match.score.leftPlayer,
              match.score.rightPlayer,
              matchWinnerId,
            ],
          );
        }

        await db.run("COMMIT");

        console.log(
          `✅ Tournament ${tournament.id} saved to database. Winner: ${winnerId}`,
        );
      } catch (error) {
        await db.run("ROLLBACK");
        console.error(`❌ Failed to save tournament ${tournament.id}:`, error);
        throw error;
      }
    },
  };
}

export type TournamentRepository = ReturnType<
  typeof createTournamentRepository
>;
