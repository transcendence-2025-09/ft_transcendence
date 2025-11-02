import { UserStatsResponseSchema } from "@transcendence/shared";
import type { FastifyRequest } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        params: z.object({
          id: z.number(),
        }),
        response: {
          200: UserStatsResponseSchema,
          400: z.object({
            error: z.string(),
          }),
          401: z.object({
            error: z.string(),
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
    },
  );
};

export default plugin;
