import Fastify, { type FastifyInstance } from "fastify";
import { healthRoute } from "./health/index.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true,
  });

  fastify.register(healthRoute);

  return fastify;
}

