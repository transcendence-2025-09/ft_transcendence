import Fastify, { type FastifyInstance } from "fastify";
import { authTestRoute } from "./auth/authTest.js";
import { healthRoute } from "./health/index.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true,
  });

  fastify.register(healthRoute);
  fastify.register(authTestRoute);

  return fastify;
}
