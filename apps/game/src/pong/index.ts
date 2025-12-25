import type { WebSocket } from "@fastify/websocket";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import type { WsMessage } from "src/types/pong";
import { PongServer } from "./PongServer";

const rooms = new Map<string, PongServer>();

export const pongLogic: FastifyPluginAsync = async (app) => {
  app.get(
    "/ws",
    { websocket: true },
    (socket: WebSocket, req: FastifyRequest) => {
      const ws = socket as WebSocket;
      const { tournamentId, matchId } = req.query as {
        tournamentId: string;
        matchId: string;
      };
      if (!tournamentId || !matchId) {
        ws.close(1008, "Missing tournamentId or matchId");
        return;
      }

      const roomKey = `${tournamentId}:${matchId}`;
      //ここで既存のPongインスタンスがなければ作る
      let session = rooms.get(roomKey) as PongServer | undefined;
      if (!session) {
        console.log(`Creating new room for ${roomKey}`);
        session = new PongServer();
        rooms.set(roomKey, session);
      } else {
        console.log(`Existing room found for ${roomKey}`);
        if (session.isRoomReady()) {
          ws.close(1008, "Room is full");
          return;
        }
      }
      session.join(ws);
      //接続確認を送る
      ws.send(JSON.stringify({ type: "hello", msg: "send init first" }));
      //初期化設定
      ws.once("message", (data: WsMessage) => {
        try {
          const msg = JSON.parse(data.toString());
          //ここでonUpdateを呼ぶ時にinitが呼ばれる
          session.onUpdate(msg);
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

      ws.on("close", () => {
        session.leave(ws);
        if (session.isEmpty()) {
          rooms.delete(roomKey);
        }
      });
    },
  );
};
