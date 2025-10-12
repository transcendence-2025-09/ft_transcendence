import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import { ErrorSchema, MatchSchema } from "../../utils/schemas.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { tournamentsManager } = fastify;

  // GET /api/tournaments/:id/matches - マッチ一覧取得
  fastify.get(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: Type.Object({
            matches: Type.Array(MatchSchema),
          }),
          401: ErrorSchema,
          404: ErrorSchema,
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      const matches = tournamentsManager.getMatches(id);

      if (!matches) {
        return reply.status(404).send({ error: "Tournament not found" });
      }

      return reply.status(200).send({ matches });
    },
  );
};

export default plugin;
