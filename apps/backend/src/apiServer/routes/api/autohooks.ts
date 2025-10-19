import "dotenv/config";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.addHook(
    "preHandler",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const jwtSecret = process.env.JWT_SECRET || "";

      // 認証を必要としないパス
      const publicPaths = ["/api/auth/login", "/api/auth/mock-login"];
      if (publicPaths.some((path) => request.url.startsWith(path))) {
        return;
      }

      // MFA認証を必要としないパス
      const mfaPublicPaths = ["/api/auth/2fa/validate"];
      if (mfaPublicPaths.some((path) => request.url.startsWith(path))) {
        if (request.cookies.mfaTicket) {
          try {
            jwt.verify(request.cookies.mfaTicket, jwtSecret) as jwt.JwtPayload;
            return;
          } catch {
            return reply.status(401).send({
              error: "MFA ticket is invalid or expired, please login again",
            });
          }
        }
        return reply.status(401).send({ error: "Unauthorized" });
      }

      const token = request.cookies.token;
      // セッショントークンが存在しない場合
      if (!token) {
        if (request.cookies.mfaTicket) {
          try {
            jwt.verify(request.cookies.mfaTicket, jwtSecret) as jwt.JwtPayload;
            return reply.status(401).send({ error: "MFA required" });
          } catch {
            return reply.status(401).send({
              error: "MFA ticket is invalid or expired, please login again",
            });
          }
        }
        return reply.status(401).send({ error: "Unauthorized" });
      }

      // セッショントークンが存在する場合
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
