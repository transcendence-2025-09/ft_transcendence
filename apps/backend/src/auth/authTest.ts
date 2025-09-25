import type { FastifyInstance, FastifyRequest } from "fastify";

export async function authTestRoute(fastify: FastifyInstance) {
  fastify.post("/api/auth/login", async (request: FastifyRequest, reply) => {
    const { code } = request.body as { code?: string };

    if (!code) {
      return reply.status(400).send({ error: "Missing code" });
    }

    console.log("Received code:", code);

    // Simulate a successful login
    return { token: "fake-jwt-token" };
  });
}
