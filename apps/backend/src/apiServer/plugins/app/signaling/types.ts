import type { WebSocket as WSWebSocket } from "ws";

export interface SignalingMessage {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "join-room"
    | "leave-room"
    | "room-full"
    | "player-joined"
    | "player-left"
    | "error"
    | "joined"
    | "connected";
  roomId?: string;
  playerId?: string;
  data?: Record<string, unknown>;
}

export interface SignalingRoom {
  id: string;
  players: Map<string, SignalingPlayer>;
  gameState: "waiting" | "ready" | "playing" | "finished";
  createdAt: number;
  maxPlayers: number;
}

export interface SignalingPlayer {
  id: string;
  userId: number;
  name: string;
  socket: WSWebSocket;
  isReady: boolean;
}
