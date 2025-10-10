import type { WebSocket as WSWebSocket } from "ws";
import type {
  SignalingMessage,
  SignalingPlayer,
  SignalingRoom,
} from "./types.js";

export class SignalingServer {
  private rooms = new Map<string, SignalingRoom>();
  private players = new Map<string, SignalingPlayer>();

  createRoom(roomId: string): SignalingRoom {
    const room: SignalingRoom = {
      id: roomId,
      players: new Map(),
      gameState: "waiting",
      createdAt: Date.now(),
      maxPlayers: 2,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, playerId: string, socket: WSWebSocket): boolean {
    const player: SignalingPlayer = {
      id: playerId,
      userId: 0,
      name: `Player_${playerId.slice(-8)}`,
      socket: socket,
      isReady: false,
    };
    let room = this.rooms.get(roomId);

    // 部屋が存在しない場合は作成
    if (!room) {
      room = this.createRoom(roomId);
    }

    // 部屋が満員の場合
    if (room.players.size >= room.maxPlayers) {
      this.sendToPlayer(player, {
        type: "room-full",
        roomId: roomId,
      });
      return false;
    }

    // プレイヤーを部屋に追加
    room.players.set(player.id, player);
    this.players.set(player.id, player);

    // 他のプレイヤーに参加を通知
    this.broadcastToRoom(
      room,
      {
        type: "player-joined",
        roomId: roomId,
        playerId: player.id,
        data: {
          playerName: player.name,
          playerCount: room.players.size,
        },
      },
      player.id,
    );

    // 参加者に成功を通知
    this.sendToPlayer(player, {
      type: "join-room",
      roomId: roomId,
      data: {
        success: true,
        playerCount: room.players.size,
        otherPlayers: Array.from(room.players.values())
          .filter((p: SignalingPlayer) => p.id !== player.id)
          .map((p: SignalingPlayer) => ({ id: p.id, name: p.name })),
      },
    });

    return true;
  }

  leaveRoom(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // プレイヤーが所属する部屋を見つける
    for (const [roomId, room] of this.rooms) {
      if (room.players.has(playerId)) {
        room.players.delete(playerId);

        // 他のプレイヤーに退出を通知
        this.broadcastToRoom(room, {
          type: "player-left",
          roomId: roomId,
          playerId: playerId,
          data: {
            playerName: player.name,
          },
        });

        // 部屋が空になったら削除
        if (room.players.size === 0) {
          this.rooms.delete(roomId);
        }
        break;
      }
    }

    this.players.delete(playerId);
  }

  public handleSignalingMessage(
    playerId: string,
    message: SignalingMessage,
  ): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const room = this.findRoomByPlayerId(playerId);
    if (!room) return;

    switch (message.type) {
      case "offer":
      case "answer":
      case "ice-candidate":
        this.broadcastToRoom(
          room,
          {
            type: message.type,
            roomId: room.id,
            playerId: playerId,
            data: message.data,
          },
          playerId,
        );
        break;
    }
  }

  /**
   * 特定のルームを取得する
   */
  public getRoom(roomId: string): SignalingRoom | undefined {
    return this.rooms.get(roomId);
  }

  private findRoomByPlayerId(playerId: string): SignalingRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room;
      }
    }
    return undefined;
  }

  private broadcastToRoom(
    room: SignalingRoom,
    message: SignalingMessage,
    excludePlayerId?: string,
  ): void {
    room.players.forEach((player: SignalingPlayer) => {
      if (player.id !== excludePlayerId) {
        this.sendToPlayer(player, message);
      }
    });
  }

  private sendToPlayer(
    player: SignalingPlayer,
    message: SignalingMessage,
  ): void {
    if (player.socket.readyState === 1) {
      // WebSocket.OPEN
      player.socket.send(JSON.stringify(message));
    }
  }
}
