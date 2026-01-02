import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { ErrorSchema, MatchSchema } from "../../../utils/schemas.js";

/**
 * GET /api/tournaments/:id/matches/:matchId
 * 特定の試合情報を取得
 */
const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const { tournamentsManager } = fastify;

  fastify.get(
    "/",
    {
      schema: {
        params: z.object({
          id: z.string(),
          matchId: z.string(),
        }),
        response: {
          200: z.object({
            match: MatchSchema,
            tournament: z.object({
              id: z.string(),
              name: z.string(),
            }),
          }),
          404: ErrorSchema,
          401: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const { id, matchId } = request.params;

      const tournament = tournamentsManager.getTournament(id);
      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      const match = tournament.matches.find((m) => m.id === matchId);
      if (!match) {
        return reply.status(404).send({ error: "Match not found" });
      }

      return reply.status(200).send({
        match,
        tournament: {
          id: tournament.id,
          name: tournament.name,
        },
      });
    },
  );
};

export default plugin;
