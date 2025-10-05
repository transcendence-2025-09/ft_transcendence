import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Object({
            id: Type.Number(),
            name: Type.String(),
          }),
          401: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      // ここでrequest.user.idでDBから取得を想定

      return reply.status(200).send({
        id: request.user.id,
        name: request.user.name,
      });
    },
  );
};

export default plugin;
