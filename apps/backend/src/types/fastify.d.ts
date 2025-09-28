import type { Database } from "sqlite";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
  }
}
