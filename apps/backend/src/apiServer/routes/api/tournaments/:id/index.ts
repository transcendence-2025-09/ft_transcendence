import { ErrorResponseSchema, TournamentSchema } from "@transcendence/shared";
import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { serializeTournament } from "../utils/serializers.js";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const { tournamentsManager } = fastify;

  // GET /api/tournaments/:id - トーナメント詳細
  fastify.get(
    "/",
    {
      schema: {
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: TournamentSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const tournament = tournamentsManager.getTournament(id);

      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      return reply.status(200).send(serializeTournament(tournament));
    },
  );
};

export default plugin;
