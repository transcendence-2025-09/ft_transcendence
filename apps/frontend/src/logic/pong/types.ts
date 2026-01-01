export type MatchData = {
  //基本定数(固定値)
  width: number;
  height: number;
  paddleWidth: number;
  paddleHeight: number;
  paddleMargin: number;
  paddleSpeed: number;
  ballRadius: number;
  ballSpeed: number;
  ballAccel: number;
  winScore: number;
  //試合に関する情報
  tournamentId: string | null;
  matchId: string | null;
  //APIから取得するデータ(バックエンドにくる時はすでにフロントで取得済み)
  leftPlayer: Player | null;
  rightPlayer: Player | null;
  clientUserId: number | null;
};

export type Player = {
  userId: number;
  alias: string;
};

export type PlayerInput = {
  up: boolean;
  down: boolean;
  leftorRight: "left" | "right";
};

export type readyPayload = {
  position: "left" | "right";
};

export type readyState = {
  leftReady: boolean;
  rightReady: boolean;
};

export type WsMessage =
  | { type: "init"; payload: MatchData }
  | { type: "connection" }
  | { type: "ready"; payload: readyState }
  | { type: "start"; payload: readyPayload }
  | { type: "input"; payload: PlayerInput }
  | { type: "snapshot"; payload: MatchState }
  | { type: "result"; payload: MatchResult }
  | { type: "pause" }
  | { type: "close" }
  | { type: "ping" };

export type MatchState = {
  width: number;
  height: number;
  ballX: number;
  ballY: number;
  ballVelX: number;
  ballVelY: number;
  paddleLeftY: number;
  paddleRightY: number;
  leftScore: number;
  rightScore: number;
  winScore: number;
  isFinish: boolean;
  isRunning: boolean;
  lastScored: "left" | "right" | null;
};

export type MatchResult = {
  leftScore: number;
  rightScore: number;
  winnerId: string;
  isFinish: boolean;
};

export type Snap = {
  time: number;
  ballX: number;
  ballY: number;
  paddleLeftY: number;
  paddleRightY: number;
};
