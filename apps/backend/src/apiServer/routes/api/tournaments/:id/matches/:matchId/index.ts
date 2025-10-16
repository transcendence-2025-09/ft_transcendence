import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { MatchSchema, ErrorSchema } from "../../../utils/schemas.js";

/**
 * GET /api/tournaments/:id/matches/:matchId
 * 特定の試合情報を取得
 */
const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  fastify.get(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
          matchId: Type.String(),
        }),
        response: {
          200: Type.Object({
            match: MatchSchema,
            tournament: Type.Object({
              id: Type.String(),
              name: Type.String(),
            }),
          }),
          404: ErrorSchema,
          401: ErrorSchema,
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string; matchId: string } }>,
      reply,
    ) => {
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
