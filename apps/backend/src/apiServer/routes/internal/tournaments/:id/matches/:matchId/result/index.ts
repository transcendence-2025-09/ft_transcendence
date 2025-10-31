import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // POST /internal/tournaments/:id/matches/:matchId/result - 試合結果を内部から受信
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
            message: Type.String(),
          }),
          400: Type.Object({
            error: Type.String(),
          }),
          404: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string; matchId: string } }>,
      reply,
    ) => {
      const { id: tournamentId, matchId } = request.params;
      const { winnerId, score } = request.body as {
        winnerId: number;
        score: { leftPlayer: number; rightPlayer: number };
      };

      fastify.log.info(
        {
          tournamentId,
          matchId,
          winnerId,
          score,
        },
        "Received match result from game server",
      );

      const tournament = tournamentsManager.getTournament(tournamentId);
      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      const match = tournamentsManager.submitMatchResult(
        tournamentId,
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
        message: "Match result recorded successfully",
      });
    },
  );
};

export default plugin;
