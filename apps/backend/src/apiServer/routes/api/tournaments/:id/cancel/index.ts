import {
  CancelTournamentResponseSchema,
  ErrorResponseSchema,
} from "@transcendence/shared";
import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";
import { serializeTournament } from "../../utils/serializers.js";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const { tournamentsManager } = fastify;

  // DELETE /api/tournaments/:id/cancel - トーナメント参加キャンセル
  fastify.delete(
    "/",
    {
      schema: {
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: CancelTournamentResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const user = request.user;
      const { id } = request.params;

      const tournament = tournamentsManager.getTournament(id);
      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      const success = tournamentsManager.cancelJoinTournament(id, user.id);
      if (!success) {
        return reply.status(400).send({
          error: "Failed to cancel join (may not be joined)",
        });
      }

      const updatedTournament = tournamentsManager.getTournament(id);
      if (!updatedTournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      return reply.status(200).send({
        success: true,
        tournament: serializeTournament(updatedTournament),
      });
    },
  );
};

export default plugin;
