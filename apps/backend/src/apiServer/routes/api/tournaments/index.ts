import "dotenv/config";
import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import {
  ErrorSchema,
  TournamentSchema,
  TournamentStatusSchema,
} from "./utils/schemas.js";
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

  // GET /api/tournaments/:id - トーナメント詳細
  fastify.get(
    "/:id",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: TournamentSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      const { id } = request.params as { id: string };
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

  // POST /api/tournaments/:id/join - トーナメント参加
  fastify.post(
    "/:id/join",
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
    async (request: FastifyRequest, reply) => {
      const user = await authenticate(request, reply);
      const { id } = request.params as { id: string };
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

  // POST /api/tournaments/:id/start - トーナメント開始
  fastify.post(
    "/:id/start",
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
    async (request: FastifyRequest, reply) => {
      const user = await authenticate(request, reply);
      const { id } = request.params as { id: string };
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
