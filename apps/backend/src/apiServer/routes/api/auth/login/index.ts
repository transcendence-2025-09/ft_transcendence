import "dotenv/config";
import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
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
    async (request: FastifyRequest, reply) => {
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
      const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "1h" });

      reply.setCookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      return reply.status(200).send();
    },
  );
};

export default plugin;
