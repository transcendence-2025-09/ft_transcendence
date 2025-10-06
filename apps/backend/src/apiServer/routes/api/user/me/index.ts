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
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      const user = await fastify.usersRepository.findById(request.user.id);
      if (!user) {
        return reply.status(400).send({ error: "User not found" });
      }

      return reply.status(200).send({
        id: user.id,
        name: user.name,
      });
    },
  );
};

export default plugin;
