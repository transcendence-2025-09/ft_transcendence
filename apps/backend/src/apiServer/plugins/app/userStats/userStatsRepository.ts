import {
  type UserStatsResponse,
  UserStatsResponseSchema,
} from "@transcendence/shared";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

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
  };
}

export default fp(async (fastify) => {
  fastify.decorate("userStatsRepository", createUserStatsRepository(fastify));
});
