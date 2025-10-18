import Fastify, { type FastifyInstance } from "fastify";
import { pongLogic } from "./pong";

import "dotenv/config";

const app: FastifyInstance = Fastify({ logger: true });
app.register(import("@fastify/websocket"));
app.register(require("@fastify/http-proxy"), {
  upstream: "http://localhost:3000",
  prefix: "/api",
  http2: false,
});
app.register(pongLogic);

app.get("/", async () => ({ message: "Hello from game server" }));

try {
  app.listen({ port: 3001, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
