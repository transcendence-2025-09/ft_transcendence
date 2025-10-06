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
            email: Type.String(),
            ft_id: Type.Number(),
          }),
          400: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: number } }>, reply) => {
      const { id } = request.params;

      const user = await fastify.usersRepository.findById(id);
      if (!user) {
        return reply.status(400).send({ error: "User not found" });
      }

      return reply.status(200).send({
        id: user.id,
        name: user.name,
        email: user.email,
        ft_id: user.ft_id,
      });
    },
  );
};

export default plugin;
