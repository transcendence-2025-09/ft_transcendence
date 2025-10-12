export type Player = {
  userId: number;
  alias: string;
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
};
