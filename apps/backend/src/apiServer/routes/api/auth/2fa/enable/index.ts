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
          secret: Type.String(),
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
          404: Type.Object({
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

      const { secret, twoFactorToken } = request.body as {
        secret: string;
        twoFactorToken: string;
      };

      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: twoFactorToken,
        window: 1,
      });

      if (!isValid) {
        return reply.status(400).send({ error: "Invalid two factor token" });
      }

      if (
        !(await fastify.usersRepository.setTwoFactor(request.user.id, secret))
      ) {
        return reply.status(500).send({ error: "DB error" });
      }

      return reply.status(200).send();
    },
  );
};

export default plugin;
