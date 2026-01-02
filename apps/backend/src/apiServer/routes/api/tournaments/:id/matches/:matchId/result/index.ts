import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";
import {
  ErrorSchema,
  MatchSchema,
  ScoreSchema,
} from "../../../../utils/schemas.js";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const { tournamentsManager } = fastify;

  // POST /api/tournaments/:id/matches/:matchId/result - 試合結果送信
  fastify.post(
    "/",
    {
      schema: {
        params: z.object({
          id: z.string(),
          matchId: z.string(),
        }),
        body: z.object({
          winnerId: z.number(),
          score: ScoreSchema,
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            match: MatchSchema,
          }),
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id, matchId } = request.params;
      const { winnerId, score } = request.body;

      const tournament = tournamentsManager.getTournament(id);
      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      const match = tournamentsManager.submitMatchResult(
        id,
        matchId,
        winnerId,
        score,
      );
      if (!match) {
        return reply.status(400).send({
          error:
            "Failed to submit match result (match may not exist, not in progress, or invalid winner)",
        });
      }

      return reply.status(200).send({
        success: true,
        match,
      });
    },
  );
};

export default plugin;
