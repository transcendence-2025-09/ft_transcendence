import { ErrorResponseSchema, MeResponseSchema } from "@transcendence/shared";
import {
  type FastifyPluginAsyncZod,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

const plugin: FastifyPluginAsyncZod = async (fastify) => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: MeResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
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
