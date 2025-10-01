import Fastify, { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import serviceApp from "./app.js";

export async function server(): Promise<void> {
  const app: FastifyInstance = Fastify({
    logger: true,
  });

  app.register(fp(serviceApp));

  app.ready(() => {
    console.log(app.printRoutes());
  });

  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
