/** トーナメントのステータス */
export type TournamentStatus =
  | "waiting"
  | "ready"
  | "in_progress"
  | "completed";

/** マッチのステータス */
export type MatchStatus = "pending" | "in_progress" | "completed";

/** マッチのラウンド */
export type MatchRound = "semifinals" | "finals" | "third_place";

/** プレイヤー情報 */
export type Player = {
  userId: number;
  alias: string;
};

/** ゲームオプション */
export type GameOptions = {
  ballSpeed: number; // ボールの速度（例: 3=ゆっくり, 6=普通, 15=速い）
  ballRadius: number; // ボールの半径（例: 3=小さい, 12=普通, 48=大きい）
};

/** トーナメント情報 */
export type Tournament = {
  id: string; // トーナメントID
  name: string; // トーナメント名
  hostId: number; // ホストのユーザーID
  maxPlayers: number; // 最大参加人数
  players?: Player[]; // 参加者リスト
  currentPlayers?: number; // 現在の参加人数
  status: TournamentStatus; // ステータス
  createdAt: string; // 作成日時
  gameOptions?: GameOptions; // ゲームオプション
};

/** マッチ情報 */
export type Match = {
  id: string; // マッチID
  round: MatchRound; // ラウンド
  leftPlayer: Player; // 左側のプレイヤー
  rightPlayer: Player; // 右側のプレイヤー
  status: MatchStatus; // ステータス
  score?: {
    // スコア（任意）
    leftPlayer: number; // 左側のプレイヤーのスコア
    rightPlayer: number; // 右側のプレイヤーのスコア
  };
  winnerId?: number; // 勝者のユーザーID
  gameOptions: GameOptions; // ゲームオプション
};
