import "dotenv/config";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = request.cookies.token;
      if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const jwtSecret = process.env.JWT_SECRET || "";

      try {
        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
        request.user = { id: decoded.id };
      } catch {
        return reply.status(401).send({ error: "Unauthorized" });
      }
    },
  );
};

export default plugin;
