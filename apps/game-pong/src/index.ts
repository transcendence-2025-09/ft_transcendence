import "dotenv/config";
import websocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";

async function main(): Promise<void> {
  const app: FastifyInstance = Fastify({
    logger: true,
  });

  app.register(websocket);

  app.register(async (fastify) => {
    fastify.get("/game", { websocket: true }, (connection, _req) => {
      connection.on("message", (message: string) => {
        connection.send(`Echo: ${message}`);
      });

      connection.on("close", () => {
        console.log("WebSocket connection closed");
      });
    });
  });

  app.ready(() => {
    console.log(app.printRoutes());
  });

  try {
    await app.listen({ port: 4000, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
