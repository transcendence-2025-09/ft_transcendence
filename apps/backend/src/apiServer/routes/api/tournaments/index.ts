import "dotenv/config";
import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { ErrorSchema, TournamentStatusSchema } from "./utils/schemas.js";
import { authenticate } from "./utils/verifyJwt.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // POST /api/tournaments - トーナメント作成
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          name: Type.String(),
        }),
        response: {
          200: Type.Object({
            tournamentId: Type.String(),
          }),
          401: ErrorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      const user = await authenticate(request, reply);
      const { name } = request.body as { name: string };
      const tournament = tournamentsManager.createTournament(name, user.id);
      return reply.status(200).send({ tournamentId: tournament.id });
    },
  );

  // GET /api/tournaments - トーナメント一覧
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Array(
            Type.Object({
              id: Type.String(),
              name: Type.String(),
              hostId: Type.Number(),
              maxPlayers: Type.Number(),
              currentPlayers: Type.Number(),
              status: TournamentStatusSchema,
              createdAt: Type.String(),
            }),
          ),
        },
      },
    },
    async (_request: FastifyRequest, reply) => {
      const tournaments = tournamentsManager.getAllTournaments();
      const response = tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        hostId: t.hostId,
        maxPlayers: t.maxPlayers,
        currentPlayers: t.players.length,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      }));

      return reply.status(200).send(response);
    },
  );
};

export default plugin;
