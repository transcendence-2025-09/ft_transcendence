import "dotenv/config";
import {
  type FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";
import type { FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  fastify.get("/me", 
    {
      schema: {
        response: {
          200: Type.Object({
            id: Type.Number(),
            name: Type.String(),
          }),
          401: Type.Object({
            error: Type.String(),
          }),
          500: Type.Object({
            error: Type.String(),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply) => {
    const token = request.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return reply.status(500).send();
    }
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as { id: number; name: string };
      return reply.status(200).send({ id: decoded.id, name: decoded.name });
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });
};

export default plugin;
