import type { FastifyInstance } from "fastify";
import { buildApp } from "./buildApp.js";
import dbPlugin from "./plugins/db.js";

async function main(): Promise<void> {
  try {
    const app: FastifyInstance = await buildApp();
    await app.register(dbPlugin);
    await app.listen({ port: 3000 });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
