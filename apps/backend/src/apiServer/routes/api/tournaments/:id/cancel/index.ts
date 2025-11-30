import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { ErrorSchema, TournamentSchema } from "../../utils/schemas.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // DELETE /api/tournaments/:id/cancel - トーナメント参加キャンセル
  fastify.delete(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
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
        tournament: {
          id: updatedTournament.id,
          name: updatedTournament.name,
          hostId: updatedTournament.hostId,
          maxPlayers: updatedTournament.maxPlayers,
          players: updatedTournament.players,
          status: updatedTournament.status,
          createdAt: updatedTournament.createdAt.toISOString(),
          gameOptions: updatedTournament.gameOptions,
        },
      });
    },
  );
};

export default plugin;
