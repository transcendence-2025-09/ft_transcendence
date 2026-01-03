import fastifyHttpProxy from "@fastify/http-proxy";
import fastifyWebsocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";
import { pongLogic } from "./pong/index.js";
import "dotenv/config";

//Fastify serverの初期化
const app: FastifyInstance = Fastify({ logger: true });

// WebSocketとHTTP Proxyの登録
app.register(fastifyWebsocket);
app.register(fastifyHttpProxy, {
  upstream: "http://localhost:3000",
  prefix: "/api",
  http2: false,
});
// Pongゲームロジックの登録
app.register(pongLogic);

// ルートエンドポイントの定義
app.get("/", async () => ({ message: "Hello from game server" }));

// サーバーの起動
try {
  app.listen({ port: 3001, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
