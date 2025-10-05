import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { ErrorSchema } from "../../utils/schemas.js";
import { authenticate } from "../../utils/verifyJwt.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // POST /api/tournaments/:id/start - トーナメント開始
  fastify.post(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            message: Type.String(),
          }),
          400: ErrorSchema,
          401: ErrorSchema,
          403: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = await authenticate(request, reply);
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
