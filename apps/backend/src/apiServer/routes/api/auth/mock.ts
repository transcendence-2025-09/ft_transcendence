import "dotenv/config";
import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { mockExchangeToken } from "./utils/mockExchangeToken.js";
import { mockFetchUserData } from "./utils/mockFetchUserData.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository } = fastify;
  fastify.post(
    "/mock-login",
    {
      schema: {
        body: Type.Object({
          code: Type.Optional(Type.String()),
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
      console.log("Mock login request received");

      const { code } = (request.body as { code?: string }) || {};
      const mockCode = code || "mock_authorization_code";

      const accessToken = await mockExchangeToken(mockCode);
      const userData = await mockFetchUserData(accessToken ?? "");

      if (!userData) {
        return reply.status(500).send({ error: "Failed to fetch user data" });
      }

      const result = await usersRepository.createUser({
        name: userData.login,
        email: userData.email,
        ft_id: userData.id,
      });

      if (!result) {
        return reply.status(500).send({ error: "Failed to register user" });
      }

      const user = await usersRepository.findByFtId(userData.id);
      if (!user) {
        return reply
          .status(500)
          .send({ error: "Failed to get user after registration" });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return reply.status(500).send({ error: "JWT secret not configured" });
      }

      const jwtPayload = { id: user.id, name: user.name };
      const token = jwt.sign(jwtPayload, jwtSecret, { expiresIn: "1h" });

      reply.setCookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        path: "/",
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      return reply.status(200).send({ message: "Mock login successful" });
    },
  );

  console.log("Mock auth endpoint registered at POST /api/auth/mock-login");
};

export default plugin;
