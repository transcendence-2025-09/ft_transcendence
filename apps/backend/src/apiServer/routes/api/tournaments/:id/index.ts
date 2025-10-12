import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { ErrorSchema, TournamentSchema } from "../utils/schemas.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // GET /api/tournaments/:id - トーナメント詳細
  fastify.get(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: TournamentSchema,
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      const tournament = tournamentsManager.getTournament(id);

      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      return reply.status(200).send({
        id: tournament.id,
        name: tournament.name,
        hostId: tournament.hostId,
        maxPlayers: tournament.maxPlayers,
        players: tournament.players,
        status: tournament.status,
        createdAt: tournament.createdAt.toISOString(),
      });
    },
  );
};

export default plugin;
