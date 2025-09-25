import type { FastifyInstance } from "fastify";
import { buildApp } from "./buildApp.js";

async function main(): Promise<void> {
  try {
    const app: FastifyInstance = await buildApp();
    await app.listen({ port: 3000 });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
