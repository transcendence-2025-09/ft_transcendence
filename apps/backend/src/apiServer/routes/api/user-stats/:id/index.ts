import { UserStatsResponseSchema } from "@transcendence/shared";
import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  fastify.get(
    "/",
    {
      schema: {
        params: z.object({
          id: z.coerce.number(),
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
    async (request, reply) => {
      const { id } = request.params;
      const userStats = await fastify.userStatsRepository.findByUserId(id);
      if (!userStats) {
        return reply.status(400).send({ error: "User stats not found" });
      }

      console.log("User stats retrieved:", userStats);

      return reply.status(200).send(userStats);
    },
  );

  fastify.post(
    "/",
    {
      schema: {
        params: z.object({
          id: z.coerce.number(),
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
    async (request, reply) => {
      const { id } = request.params;
      const userStats =
        await fastify.userStatsRepository.createOrUpdateUserStats(id);
      if (!userStats) {
        return reply
          .status(400)
          .send({ error: "Failed to create or update user stats" });
      }

      console.log("User stats created or updated:", userStats);

      return reply.status(200).send(userStats);
    },
  );
};

export default plugin;
