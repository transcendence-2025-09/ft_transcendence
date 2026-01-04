import {
  ErrorResponseSchema,
  SuccessMessageResponseSchema,
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

  // POST /api/tournaments/:id/start - トーナメント開始
  fastify.post(
    "/",
    {
      schema: {
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: SuccessMessageResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
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

      if (tournament.hostId !== user.id) {
        return reply
          .status(403)
          .send({ error: "Only the host can start the tournament" });
      }

      const success = tournamentsManager.startTournament(id, user.id);
      if (!success) {
        return reply.status(400).send({ error: "Not enough players" });
      }

      return reply.status(200).send({
        success: true,
        message: "Tournament started successfully",
      });
    },
  );
};

export default plugin;
