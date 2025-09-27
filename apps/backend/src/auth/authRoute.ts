import "dotenv/config";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { registerUser } from "../database/user/registerUser.js";
import { exchangeToken } from "./utils/exchangeToken.js";
import { fetchUserData } from "./utils/fetchUserData.js";

export async function authRoute(fastify: FastifyInstance) {
  fastify.post("/api/auth/login", async (request: FastifyRequest, reply) => {
    const { code } = request.body as { code?: string };

    if (!code) {
      return reply.status(400).send({ error: "Missing code" });
    }

    const accessToken = await exchangeToken(code);
    console.log(accessToken);

    const userData = await fetchUserData(accessToken ?? "");
    console.log(userData);

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

    // demo用コード
    const users = await fastify.db.all("SELECT * FROM users");
    console.log(users);
    const joinedUserData = `${userData.id}.${userData.login}.${userData.email}`;

    return { token: joinedUserData };
  });
}
