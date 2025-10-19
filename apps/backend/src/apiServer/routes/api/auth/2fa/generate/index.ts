import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import QRCode from "qrcode";
import speakeasy from "speakeasy";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        response: {
          200: Type.Object({
            otpauthUrl: Type.String(),
            qrCode: Type.String(),
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

      const secret = speakeasy.generateSecret({
        name: "ft_transcendence",
        issuer: "42Team",
      });
      if (!secret.otpauth_url) {
        return reply.status(500).send({ error: "Failed to generate secret" });
      }
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      reply.setCookie("TemporaryTwoFactorSecret", secret.base32, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      return reply.status(200).send({
        otpauthUrl: secret.otpauth_url,
        qrCode: qrCodeUrl,
      });
    },
  );
};

export default plugin;
