import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { ErrorSchema, TournamentSchema } from "../../utils/schemas.js";
import { authenticate } from "../../utils/verifyJwt.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // POST /api/tournaments/:id/join - トーナメント参加
  fastify.post(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        body: Type.Object({
          alias: Type.String(),
        }),
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            tournament: TournamentSchema,
          }),
          400: ErrorSchema,
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const user = await authenticate(request, reply);
      const { id } = request.params;
      const { alias } = request.body as { alias: string };

      const tournament = tournamentsManager.getTournament(id);
      if (!tournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      const success = tournamentsManager.joinTournament(id, user.id, alias);
      if (!success) {
        return reply.status(400).send({
          error: "Failed to join tournament (may be full or already joined)",
        });
      }

      const updatedTournament = tournamentsManager.getTournament(id);
      if (!updatedTournament) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      return reply.status(200).send({
        success: true,
        tournament: {
          id: updatedTournament.id,
          name: updatedTournament.name,
          hostId: updatedTournament.hostId,
          maxPlayers: updatedTournament.maxPlayers,
          players: updatedTournament.players,
          status: updatedTournament.status,
          createdAt: updatedTournament.createdAt.toISOString(),
        },
      });
    },
  );
};

export default plugin;
