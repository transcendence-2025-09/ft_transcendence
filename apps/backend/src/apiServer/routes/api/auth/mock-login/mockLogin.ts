import "dotenv/config";
import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export const pluginMockLogin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { usersRepository } = fastify;
  fastify.post(
    "/mock-login",
    {
      schema: {
        body: Type.Object({
          username: Type.Optional(Type.String()),
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

      const { username } = (request.body as { username?: string }) || {};
      const mockUsername = username || "mockuser";

      const ft_id = Math.floor(10000 + Math.random() * 90000);

      const user = await usersRepository.createUser({
        name: mockUsername,
        email: `${mockUsername}@example.com`,
        ft_id: ft_id,
      });

      if (!user) {
        return reply
          .status(500)
          .send({ error: "Failed to get user after registration" });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return reply.status(500).send({ error: "JWT secret not configured" });
      }

      const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "1h" });

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
