import {
  ErrorResponseSchema,
  MatchStartResponseSchema,
} from "@transcendence/shared";
import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const { tournamentsManager } = fastify;

  // POST /api/tournaments/:id/matches/:matchId/start - 試合開始
  fastify.post(
    "/",
    {
      schema: {
        params: z.object({
          id: z.string(),
          matchId: z.string(),
        }),
        response: {
          200: MatchStartResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id, matchId } = request.params;

      const tournament = tournamentsManager.getTournament(id);
      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      const success = tournamentsManager.startMatch(id, matchId);
      if (!success) {
        return reply.status(400).send({
          error: "Failed to start match (may not exist or already started)",
        });
      }

      return reply.status(200).send({
        success: true,
        matchId,
      });
    },
  );
};

export default plugin;
