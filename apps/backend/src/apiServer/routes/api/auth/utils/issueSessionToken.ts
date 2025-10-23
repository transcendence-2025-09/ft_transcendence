import type { FastifyReply } from "fastify";
import jwt from "jsonwebtoken";

export async function issueSessionToken(
  userId: number,
  jwtSecret: string,
  reply: FastifyReply,
) {
  const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: "1h" });
  reply.setCookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });
}
