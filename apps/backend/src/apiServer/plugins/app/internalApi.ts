import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    verifyInternalApiToken: (token: string) => boolean;
  }
}

const internalApiPlugin: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

  if (!INTERNAL_API_SECRET) {
    fastify.log.warn(
      "INTERNAL_API_SECRET is not set. Internal API endpoints will not work.",
    );
  }

  fastify.decorate("verifyInternalApiToken", (token: string): boolean => {
    if (!INTERNAL_API_SECRET) {
      return false;
    }
    return token === INTERNAL_API_SECRET;
  });
};

export default fp(internalApiPlugin);
