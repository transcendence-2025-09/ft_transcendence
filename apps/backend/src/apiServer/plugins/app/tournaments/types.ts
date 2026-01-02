export type Player = {
  userId: number;
  alias: string;
};

export type GameOptions = {
  ballSpeed: number; // ボールの速度（例: 3=ゆっくり, 6=普通, 15=速い）
  ballRadius: number; // ボールの半径（例: 3=小さい, 12=普通, 48=大きい）
};

export type Match = {
  id: string;
  round: "semifinals" | "finals" | "third_place";
  leftPlayer: Player;
  rightPlayer: Player;
  status: "pending" | "in_progress" | "completed";
  score?: {
    leftPlayer: number;
    rightPlayer: number;
  };
  winnerId?: number;
  gameOptions: GameOptions;
};

export type Tournament = {
  id: string;
  name: string;
  hostId: number;
  maxPlayers: number;
  players: Player[];
  status: "waiting" | "ready" | "in_progress" | "completed";
  matches: Match[];
  createdAt: Date;
  gameOptions: GameOptions; // トーナメントのゲームオプション
};
