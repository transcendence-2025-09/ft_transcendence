import type { Database } from "sqlite";
import type { Tournament } from "./types.js";

/**
 * トーナメント結果をDBに保存するRepository
 */
export function createTournamentRepository(db: Database) {
  /** ラウンド名を数値に変換（semifinals=1, third_place=2, finals=3） */
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

  // ===================
  // 公開API
  // ===================

  return {
    /** トーナメント全体をDBに保存（トランザクション） */
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

          await db.run(
            `INSERT INTO matches (id, tournament_id, round, player1_id, player2_id, player1_score, player2_score, winner_id, ball_speed, ball_radius, played_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
             ON CONFLICT(id) DO UPDATE SET
               player1_score = ?,
               player2_score = ?,
               winner_id = ?,
               ball_speed = ?,
               ball_radius = ?`,
            [
              match.id,
              tournament.id,
              roundNumber,
              match.leftPlayer.userId,
              match.rightPlayer.userId,
              match.score.leftPlayer,
              match.score.rightPlayer,
              match.winnerId,
              match.gameOptions.ballSpeed,
              match.gameOptions.ballRadius,
              match.score.leftPlayer,
              match.score.rightPlayer,
              match.winnerId,
              match.gameOptions.ballSpeed,
              match.gameOptions.ballRadius,
            ],
          );
        }
        await db.run("COMMIT");
        console.log(
          `Tournament ${tournament.id} saved to database. Winner: ${winnerId}`,
        );
      } catch (error) {
        await db.run("ROLLBACK");
        console.error(`Failed to save tournament ${tournament.id}:`, error);
        throw error;
      }
    },
  };
}

export type TournamentRepository = ReturnType<
  typeof createTournamentRepository
>;
