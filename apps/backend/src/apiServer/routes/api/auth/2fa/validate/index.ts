import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import speakeasy from "speakeasy";
import { issueSessionToken } from "../../utils/issueSessionToken.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          twoFactorToken: Type.String(),
        }),
        response: {
          200: Type.Object({
            passed: Type.Boolean(),
            message: Type.String(),
          }),
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
        return reply
          .status(200)
          .send({ passed: false, message: "Invalid two factor token" });
      }

      if (!process.env.JWT_SECRET) {
        return reply.status(500).send({ error: "JWT_SECRET is not set" });
      }
      await issueSessionToken(user.id, process.env.JWT_SECRET, reply);
      reply.clearCookie("mfaTicket");

      return reply
        .status(200)
        .send({ passed: true, message: "Two factor authentication passed" });
    },
  );
};

export default plugin;
