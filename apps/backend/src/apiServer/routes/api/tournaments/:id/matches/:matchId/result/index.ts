import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { ErrorSchema, MatchSchema } from "../../../../utils/schemas.js";
import { authenticate } from "../../../../utils/verifyJwt.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // POST /api/tournaments/:id/matches/:matchId/result - 試合結果送信
  fastify.post(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
          matchId: Type.String(),
        }),
        body: Type.Object({
          winnerId: Type.Number(),
          score: Type.Object({
            leftPlayer: Type.Number(),
            rightPlayer: Type.Number(),
          }),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            match: MatchSchema,
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
      const { winnerId, score } = request.body as {
        winnerId: number;
        score: { leftPlayer: number; rightPlayer: number };
      };

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
