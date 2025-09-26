import "dotenv/config";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { exchangeToken } from "./utils/exchangeToken.js";

export async function authRoute(fastify: FastifyInstance) {
  fastify.post("/api/auth/login", async (request: FastifyRequest, reply) => {
    const { code } = request.body as { code?: string };

    if (!code) {
      return reply.status(400).send({ error: "Missing code" });
    }

    const accessToken = await exchangeToken(code);
    console.log(accessToken);

    // ここにアクセストークンで42APIからユーザ名等をfetch、DBに保存後JWTを発行する処理を追加予定

    return { token: accessToken };
  });
}
