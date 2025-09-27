import Fastify, { type FastifyInstance } from "fastify";
import { authRoute } from "./auth/authRoute.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true,
  });

  fastify.register(authRoute);

  return fastify;
}
