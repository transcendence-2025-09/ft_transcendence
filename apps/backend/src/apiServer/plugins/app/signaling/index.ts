import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { SignalingServer } from "./SignalingServer.js";
import type { SignalingMessage } from "./types.js";

const signalingServer = new SignalingServer();

async function signalingPlugin(fastify: FastifyInstance) {
  // WebSocketサポートを登録
  await fastify.register(websocket);

  // WebSocket実装
  fastify.register(async (fastify) => {
    fastify.get(
      "/signaling/:roomId",
      { websocket: true },
      (socket, request) => {
        const { roomId } = request.params as { roomId: string };
        let playerId: string | null = null;

        socket.on("message", (data: Buffer) => {
          try {
            const message: SignalingMessage = JSON.parse(data.toString());

            switch (message.type) {
              case "join-room": {
                playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const success = signalingServer.joinRoom(
                  roomId,
                  playerId,
                  socket,
                );

                if (success) {
                  socket.send(
                    JSON.stringify({
                      type: "joined",
                      data: { playerId, roomId },
                    }),
                  );
                } else {
                  socket.send(
                    JSON.stringify({
                      type: "error",
                      data: { message: "Failed to join room" },
                    }),
                  );
                }
                break;
              }

              case "offer":
              case "answer":
              case "ice-candidate":
                if (playerId) {
                  signalingServer.handleSignalingMessage(playerId, message);
                }
                break;

              default:
                break;
            }
          } catch {
            socket.send(
              JSON.stringify({
                type: "error",
                data: { message: "Invalid message format" },
              }),
            );
          }
        });

        socket.on("close", () => {
          if (playerId) {
            signalingServer.leaveRoom(playerId);
          }
        });

        socket.on("error", () => {
          if (playerId) {
            signalingServer.leaveRoom(playerId);
          }
        });

        // 接続確認メッセージを送信
        socket.send(
          JSON.stringify({
            type: "connected",
            data: {
              message: `Connected to signaling server for room: ${roomId}`,
            },
          }),
        );
      },
    );
  });
}

export default fp(signalingPlugin);
