import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import speakeasy from "speakeasy";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          twoFactorToken: Type.String(),
        }),
        response: {
          200: {
            type: "null",
          },
          400: Type.Object({
            error: Type.String(),
          }),
          401: Type.Object({
            error: Type.String(),
          }),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const user = await fastify.usersRepository.findById(request.user.id);
      if (!user) {
        return reply.status(500).send({ error: "DB error" });
      }

      if (!user.two_factor_secret || !user.two_factor_enabled) {
        return reply
          .status(400)
          .send({ error: "Two factor authentication is not setup" });
      }

      const isValid = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: "base32",
        token: (request.body as { twoFactorToken: string }).twoFactorToken,
        window: 1,
      });

      if (!isValid) {
        return reply.status(401).send({ error: "Invalid two factor token" });
      }

      if (!(await fastify.usersRepository.removeTwoFactor(request.user.id))) {
        return reply.status(500).send({ error: "DB error" });
      }

      return reply.status(200).send();
    },
  );
};

export default plugin;
