import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: Type.Object({
            id: Type.String(),
            user_id: Type.Number(),
            average_score: Type.Number(),
            number_of_matches: Type.Number(),
            number_of_wins: Type.Number(),
            current_winning_streak: Type.Number(),
            total_score_points: Type.Number(),
            total_loss_points: Type.Number(),
            last_match_id: Type.Union([Type.String(), Type.Null()]),
            last_updated: Type.String(),
          }),
          400: Type.Object({
            error: Type.String(),
          }),
          401: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: number } }>, reply) => {
      const { id } = request.params;

      const userStats = await fastify.userStatsRepository.findByUserId(id);
      if (!userStats) {
        return reply.status(400).send({ error: "User stats not found" });
      }

      return reply.status(200).send(userStats);
    }
  );
};

export default plugin;
