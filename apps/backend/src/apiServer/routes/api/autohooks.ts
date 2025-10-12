import "dotenv/config";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // 認証を必要としないパス
      const publicPaths = ["/api/auth/login", "/api/auth/mock-login"];
      if (publicPaths.some((path) => request.url.startsWith(path))) {
        return;
      }

      const token = request.cookies.token;
      if (!token) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const jwtSecret = process.env.JWT_SECRET || "";

      try {
        const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;
        request.user = { id: decoded.id };
      } catch {
        return reply.status(401).send({ error: "Token is invalid or expired" });
      }
    },
  );
};

export default plugin;
