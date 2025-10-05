import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
        response: {
          200: Type.Object({
            id: Type.Number(),
            name: Type.String(),
          }),
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: number } }>, reply) => {
      const { id } = request.params;

      // ここでパスパラメータの:idを使ってDBから取得を想定

      return reply.status(200).send({
        id: id,
        name: "example user",
      });
    },
  );
};

export default plugin;