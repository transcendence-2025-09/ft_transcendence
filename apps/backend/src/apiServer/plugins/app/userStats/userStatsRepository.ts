import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    userStatsRepository: ReturnType<typeof createUserStatsRepository>;
  }
}

export type UserStatsRecord = {
  id: string; // uuidv7
  user_id: number;
  average_score: number;
  number_of_matches: number;
  number_of_wins: number;
  current_winning_streak: number;
  total_score_points: number;
  total_loss_points: number;
  last_match_id: string | null;
  last_updated: string; // ISO date string
};

export function createUserStatsRepository(fastify: FastifyInstance) {
  return {
    async findByUserId(user_id: number): Promise<UserStatsRecord | null> {
      try {
        const userStats = await fastify.db.get(
          "SELECT * FROM user_stats WHERE user_id = ?",
          [user_id],
        );
        return userStats || null;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
  };
}

export default fp(async (fastify) => {
  fastify.decorate(
    "userStatsRepository",
    createUserStatsRepository(fastify),
  );
});
