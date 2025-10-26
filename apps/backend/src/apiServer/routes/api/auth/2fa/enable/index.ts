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

      const user = await fastify.usersRepository.findById(request.user.id);
      if (!user) {
        return reply.status(500).send({ error: "DB error" });
      }

      if (user.two_factor_enabled) {
        return reply
          .status(400)
          .send({ error: "Two factor authentication is already enabled" });
      }

      const { twoFactorToken } = request.body as {
        twoFactorToken: string;
      };

      const temporaryTwoFactorSecret = request.cookies.TemporaryTwoFactorSecret;
      if (!temporaryTwoFactorSecret) {
        return reply
          .status(400)
          .send({ error: "should generate two factor secret first" });
      }

      const isValid = speakeasy.totp.verify({
        secret: temporaryTwoFactorSecret,
        encoding: "base32",
        token: twoFactorToken,
        window: 1,
      });

      if (!isValid) {
        return reply.status(400).send({ error: "Invalid two factor token" });
      }

      if (
        !(await fastify.usersRepository.setTwoFactor(
          request.user.id,
          temporaryTwoFactorSecret,
        ))
      ) {
        return reply.status(500).send({ error: "DB error" });
      }
      reply.clearCookie("TemporaryTwoFactorSecret");

      return reply.status(200).send();
    },
  );
};

export default plugin;
