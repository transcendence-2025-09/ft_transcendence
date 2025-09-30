import Fastify, { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import serviceApp from "./app.js";

async function server(): Promise<void> {
  const app: FastifyInstance = Fastify({
    logger: true,
  });

  app.register(fp(serviceApp));

  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

server();
