import "dotenv/config";
import type { FastifyInstance, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

export async function getMe(fastify: FastifyInstance) {
  fastify.get("/api/user/me", async (request: FastifyRequest, reply) => {
    const token = request.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return reply.status(500).send();
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as {
        id: number;
        name: string;
      };
      return { id: decoded.id, name: decoded.name };
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });
}
