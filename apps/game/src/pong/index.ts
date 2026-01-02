import type { WebSocket } from "@fastify/websocket";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import type { WsMessage } from "../types/pong.js";
import { PongServer } from "./PongServer.js";

//部屋ごとのPongサーバーインスタンスを管理するマップ
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
      let session: PongServer | undefined = rooms.get(roomKey);
      if (!session) {
        console.log(`Creating new room for ${roomKey}`);
        session = new PongServer();
        rooms.set(roomKey, session);
      } else {
        if (session.isRoomReady()) {
          ws.close(1008, "Room is full");
          return;
        }
      }
      session.join(ws);

      // WebSocketメッセージの受信処理
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
