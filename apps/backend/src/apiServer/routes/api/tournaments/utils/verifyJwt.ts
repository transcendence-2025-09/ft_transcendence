import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

/**
 * JWT認証ヘルパー関数
 * @param request FastifyRequest
 * @param reply FastifyReply
 * @returns ユーザー情報 { id: number, name: string }
 * @throws 認証エラー時にエラーレスポンスを返してthrow
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<{ id: number; name: string }> {
  const token = request.cookies.token;
  if (!token) {
    reply.status(401).send({ error: "Unauthorized" });
    throw new Error("Unauthorized");
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    reply.status(500).send({ error: "JWT secret not configured" });
    throw new Error("JWT secret not configured");
  }

  try {
    return jwt.verify(token, jwtSecret) as { id: number; name: string };
  } catch {
    reply.status(401).send({ error: "Invalid token" });
    throw new Error("Invalid token");
  }
}
