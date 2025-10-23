import "dotenv/config";
import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { issueSessionToken } from "../utils/issueSessionToken.js";
import { exchangeToken } from "./utils/exchangeToken.js";
import { fetchFtUserData } from "./utils/fetchFtUserData.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository } = fastify;
  fastify.post(
    "/",
    {
      schema: {
        body: Type.Object({
          code: Type.String(),
        }),
        response: {
          200: Type.Object({
            needTwoFactor: Type.Boolean(),
            message: Type.String(),
          }),
          400: Type.Object({
            error: Type.String(),
          }),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      console.log("Login request received");
      const { code } = request.body as { code?: string };
      const accessToken = await exchangeToken(code ?? "");
      const ftUserData = await fetchFtUserData(accessToken ?? "");
      if (!ftUserData) {
        return reply.status(500).send({ error: "Failed to fetch user data" });
      }

      const user = await usersRepository.createUser({
        name: ftUserData.login,
        email: ftUserData.email,
        ft_id: ftUserData.id,
      });

      if (!user) {
        return reply
          .status(500)
          .send({ error: "Failed to get user after registration" });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return reply.status(500).send();
      }

      if (user.two_factor_enabled) {
        // 2FAが有効な場合、MFAチケットを生成してクッキーに保存
        await issueMfaTicket(user.id, jwtSecret, reply);

        return reply.status(200).send({
          needTwoFactor: true,
          message: "MFA required",
        });
      } else {
        // 2FAが無効な場合、JWTトークンを生成してクッキーに保存
        await issueSessionToken(user.id, jwtSecret, reply);

        return reply.status(200).send({
          needTwoFactor: false,
          message: "Login successful",
        });
      }
    },
  );
};

async function issueMfaTicket(
  userId: number,
  jwtSecret: string,
  reply: FastifyReply,
) {
  const mfaTicket = jwt.sign({ id: userId, purpose: "mfa" }, jwtSecret, {
    expiresIn: "10m",
  });
  reply.setCookie("mfaTicket", mfaTicket, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });
}

export default plugin;
