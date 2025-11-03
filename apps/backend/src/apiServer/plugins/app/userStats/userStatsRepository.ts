import {
  type MatchesResponse,
  MatchesResponseSchema,
  type UserStatsResponse,
  UserStatsResponseSchema,
} from "@transcendence/shared";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { v7 as uuidv7 } from "uuid";

declare module "fastify" {
  interface FastifyInstance {
    userStatsRepository: ReturnType<typeof createUserStatsRepository>;
  }
}

export function createUserStatsRepository(fastify: FastifyInstance) {
  return {
    async findByUserId(user_id: number): Promise<UserStatsResponse | null> {
      try {
        const userStats = await fastify.db.get(
          "SELECT * FROM user_stats WHERE user_id = ?",
          [user_id],
        );
        const parsed = UserStatsResponseSchema.safeParse(userStats);
        return parsed.success ? parsed.data : null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },

    async createOrUpdateUserStats(
      user_id: number,
    ): Promise<UserStatsResponse | null> {
      try {
        // 1. statsが存在するか確認(現在のstatsを取得)
        const userStats = await fastify.db.get(
          "SELECT * FROM user_stats WHERE user_id = ?",
          [user_id],
        );
        if (!userStats) {
          // 1.1. 存在しない場合は新規作成
          await fastify.db.run(
            `INSERT INTO user_stats (id, user_id, average_score, number_of_matches, number_of_wins, current_winning_streak, total_score_points, total_loss_points, last_match_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv7(), user_id, 0, 0, 0, 0, 0, 0, null],
          );
        } else {
          // 1.2. 存在する場合はmatchesテーブルから集計して更新
          const matchStats = await fastify.db.all(
            "SELECT * FROM matches WHERE player1_id = ? OR player2_id = ?",
            [user_id, user_id],
          );
          const parsed = MatchesResponseSchema.array().safeParse(matchStats);
          if (!parsed.success) {
            console.error("Matches data validation failed", parsed.error);
            return null;
          }
          const matches: MatchesResponse[] = parsed.data;

          const number_of_matches = matches.length;
          const number_of_wins = matches.filter(
            (match) =>
              (match.player1_id === user_id &&
                match.player1_score > match.player2_score) ||
              (match.player2_id === user_id &&
                match.player2_score > match.player1_score),
          ).length;
          const total_score_points = matches.reduce((acc, match) => {
            if (match.player1_id === user_id) return acc + match.player1_score;
            else return acc + match.player2_score;
          }, 0);
          const total_loss_points = matches.reduce((acc, match) => {
            if (match.player1_id === user_id) return acc + match.player2_score;
            else return acc + match.player1_score;
          }, 0);
          const average_score =
            number_of_matches > 0 ? total_score_points / number_of_matches : 0;
          const current_winning_streak = (() => {
            let streak = 0;
            for (let i = matches.length - 1; i >= 0; i--) {
              const match = matches[i];
              const isWin =
                (match.player1_id === user_id &&
                  match.player1_score > match.player2_score) ||
                (match.player2_id === user_id &&
                  match.player2_score > match.player1_score);
              if (isWin) streak++;
              else break;
            }
            return streak;
          })();
          const last_match_id =
            matches.length > 0 ? matches[matches.length - 1].id : null;

          await fastify.db.run(
            `UPDATE user_stats SET average_score = ?, number_of_matches = ?, number_of_wins = ?, current_winning_streak = ?, total_score_points = ?, total_loss_points = ?, last_match_id = ? WHERE user_id = ?`,
            [
              average_score,
              number_of_matches,
              number_of_wins,
              current_winning_streak,
              total_score_points,
              total_loss_points,
              last_match_id,
              user_id,
            ],
          );
        }
        // 2. 更新後のstatsを返す
        return await this.findByUserId(user_id);
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  };
}

export default fp(async (fastify) => {
  fastify.decorate("userStatsRepository", createUserStatsRepository(fastify));
});
