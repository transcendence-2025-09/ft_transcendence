import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyReply, FastifyRequest } from "fastify";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply
          .status(401)
          .send({ error: "Missing authorization header" });
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      if (!fastify.verifyInternalApiToken(token)) {
        return reply.status(403).send({ error: "Invalid internal API token" });
      }
    },
  );
};

export default plugin;
