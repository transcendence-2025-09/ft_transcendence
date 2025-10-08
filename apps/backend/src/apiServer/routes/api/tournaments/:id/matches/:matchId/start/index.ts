import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { ErrorSchema } from "../../../../utils/schemas.js";
import { authenticate } from "../../../../utils/verifyJwt.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // POST /api/tournaments/:id/matches/:matchId/start - 試合開始
  fastify.post(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
          matchId: Type.String(),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            matchId: Type.String(),
          }),
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string; matchId: string } }>,
      reply,
    ) => {
      await authenticate(request, reply);
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
