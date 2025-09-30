import cookie from "@fastify/cookie";
import Fastify, { type FastifyInstance } from "fastify";
import { authRoute } from "./auth/authRoute.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({
    logger: true,
  });

  fastify.register(authRoute);
  fastify.register(cookie);

  return fastify;
}
