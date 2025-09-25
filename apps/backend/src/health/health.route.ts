import type { FastifyInstance, FastifyRequest } from "fastify";

export async function healthRoute(fastify: FastifyInstance) {
  fastify.get("/api/health", async (_request: FastifyRequest) => {
    return { status: "ok" };
  });
}
