import type { WebSocket } from "@fastify/websocket";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import type { WsMessage } from "src/types/pong";
import { PongServer } from "./PongServer";

export const pongLogic: FastifyPluginAsync = async (app) => {
  app.get(
    "/ws",
    { websocket: true },
    (socket: WebSocket, _req: FastifyRequest) => {
      const ws = socket as WebSocket;
      //ここでサーバー側のPongインスタンスを生成
      const session = new PongServer(socket);
      //接続確認を送る
      ws.send(JSON.stringify({ type: "hello", msg: "send init first" }));
      //初期化設定
      ws.once("message", (data: WsMessage) => {
        try {
          const msg = JSON.parse(data.toString());
          //ここでonUpdateを呼ぶ時にinitが呼ばれる
          session.onUpdate(msg);
          ws.send(JSON.stringify({ type: "ready" }));
        } catch (_e) {
          ws.close(1003, "Bad init");
          return;
        }
      });

      //接続後の通信はこっち
      ws.on("message", (data: WsMessage) => {
        const msg = JSON.parse(data.toString());
        session.onUpdate(msg);
      });
    },
  );
};
