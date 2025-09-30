import "dotenv/config";
import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { exchangeToken } from "./utils/exchangeToken.js";
import { fetchUserData } from "./utils/fetchUserData.js";
import { type FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox";
import { registerUser } from "src/database/user/registerUser.js";
import { getUserWithFtId } from "src/database/user/getUserWithFtId.js";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.post(
    "/login",
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
      const { code } = request.body as { code?: string };
      const accessToken = await exchangeToken(code ?? "");
      const userData = await fetchUserData(accessToken ?? "");
      if (!userData) {
        return reply.status(500).send({ error: "Failed to fetch user data" });
      }

      const result = await registerUser(fastify.db, {
        name: userData.login,
        email: userData.email,
        ft_id: userData.id,
      });
      
      if (!result) {
        return reply.status(500).send({ error: "Failed to register user" });
      }

      const user = await getUserWithFtId(fastify.db, userData.id);
      if (!user) {
        return reply
          .status(500)
          .send({ error: "Failed to get user after registration" });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return reply.status(500).send();
      }
      const jwtPayload = { id: user.id, name: user.name };
      const token = jwt.sign(jwtPayload, jwtSecret, { expiresIn: "1h" });

      reply.setCookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      return reply.status(200).send();
    });
};

export default plugin;
