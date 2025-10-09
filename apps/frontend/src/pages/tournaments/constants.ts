// トーナメント画面の共通定数

/** トーナメントステータスの定数 */
export const TOURNAMENT_STATUS = {
  WAITING: "waiting",
  READY: "ready",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

/** マッチステータスの定数 */
export const MATCH_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

/** マッチラウンドの定数 */
export const MATCH_ROUND = {
  SEMIFINALS: "semifinals",
  FINALS: "finals",
  THIRD_PLACE: "third_place",
} as const;

/** ステータスの日本語ラベル */
export const STATUS_LABELS: Record<string, string> = {
  waiting: "待機中",
  ready: "準備完了",
  in_progress: "進行中",
  completed: "完了",
};

/** エラーメッセージの定数 */
export const ERROR_MESSAGES = {
  GENERIC: "エラーが発生しました",
  TOURNAMENT_NOT_FOUND: "トーナメントが見つかりません",
  MATCH_NOT_FOUND: "マッチが見つかりません",
  NO_TOURNAMENTS: "トーナメントがありません",
  NO_MATCHES: "まだマッチがありません",
  NO_PLAYERS: "まだ参加者がいません",
  LOADING: "読み込み中...",
} as const;
