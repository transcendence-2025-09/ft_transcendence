import "dotenv/config";
import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { z } from "zod";
import {
  ErrorSchema,
  GameOptionsSchema,
  TournamentListItemSchema,
} from "./utils/schemas.js";
import { serializeTournamentListItem } from "./utils/serializers.js";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  const { tournamentsManager } = fastify;

  // POST /api/tournaments - トーナメント作成
  fastify.post(
    "/",
    {
      schema: {
        body: z.object({
          name: z.string(),
          gameOptions: GameOptionsSchema,
        }),
        response: {
          200: z.object({
            tournamentId: z.string(),
          }),
          401: ErrorSchema,
          400: ErrorSchema,
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const user = request.user;
      const { name, gameOptions } = request.body;
      const tournament = tournamentsManager.createTournament(
        name,
        user.id,
        gameOptions,
      );
      return reply.status(200).send({ tournamentId: tournament.id });
    },
  );

  // GET /api/tournaments - トーナメント一覧
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: z.array(TournamentListItemSchema),
          401: ErrorSchema,
        },
      },
    },
    async (_request, reply) => {
      const tournaments = tournamentsManager.getAllTournaments();

      // 完了したトーナメントを除外し、待機中→対戦中の順でソート
      const response = tournaments
        .filter((t) => t.status !== "completed")
        .sort((a, b) => {
          // 待機中(waiting/ready)を先に、対戦中(in_progress)を後に
          const aIsWaiting = a.status === "waiting" || a.status === "ready";
          const bIsWaiting = b.status === "waiting" || b.status === "ready";
          if (aIsWaiting && !bIsWaiting) return -1;
          if (!aIsWaiting && bIsWaiting) return 1;
          // 同じステータスの場合は作成日時順（新しい順）
          return b.createdAt.getTime() - a.createdAt.getTime();
        })
        .map(serializeTournamentListItem);

      return reply.status(200).send(response);
    },
  );
};

export default plugin;
