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
            email: Type.String(),
            ft_id: Type.Number(),
            two_factor_enabled: Type.Boolean(),
          }),
          400: Type.Object({
            error: Type.String(),
          }),
          401: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const user = await fastify.usersRepository.findById(request.user.id);
      if (!user) {
        return reply.status(400).send({ error: "User not found" });
      }

      return reply.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        ft_id: user.ft_id,
        two_factor_enabled: user.two_factor_enabled,
      });
    },
  );
};

export default plugin;
