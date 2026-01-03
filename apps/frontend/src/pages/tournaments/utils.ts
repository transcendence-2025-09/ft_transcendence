import { ERROR_MESSAGES, STATUS_LABELS } from "./constants";
import type { Player } from "./types";

/**
 * ステータスの日本語ラベルを取得
 * @param status - ステータス文字列
 * @returns 日本語ラベル（存在しない場合は元の文字列）
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

/**
 * コンテナにエラーメッセージを表示
 * @param container - 表示先のHTML要素
 * @param message - エラーメッセージ（デフォルト: 汎用エラーメッセージ）
 */
export function showError(
  container: HTMLElement,
  message: string = ERROR_MESSAGES.GENERIC,
): void {
  container.innerHTML = `<p class="text-red-500 text-center">${message}</p>`;
}

/**
 * コンテナにローディングメッセージを表示
 * @param container - 表示先のHTML要素
 */
export function showLoading(container: HTMLElement): void {
  container.innerHTML = `<p class="text-gray-500 text-center">${ERROR_MESSAGES.LOADING}</p>`;
}

/**
 * コンテナに情報メッセージを表示
 * @param container - 表示先のHTML要素
 * @param message - 情報メッセージ
 */
export function showInfo(container: HTMLElement, message: string): void {
  container.innerHTML = `<p class="text-gray-500 text-center">${message}</p>`;
}

/**
 * HTMLをエスケープしてXSS攻撃を防止
 * @param text - エスケープする文字列
 * @returns エスケープされたHTML文字列
 */
export function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 日付文字列をロケール形式にフォーマット
 * @param dateString - ISO形式の日付文字列
 * @returns ロケール形式の日付文字列
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

/**
 * 試合結果から勝者を取得
 * @param match - マッチ情報
 * @returns 勝者のPlayer情報（勝者が決まっていない場合はnull）
 */
export function getWinner(match: {
  leftPlayer: Player;
  rightPlayer: Player;
  winnerId?: number;
}): Player | null {
  if (!match.winnerId) return null;
  if (match.leftPlayer.userId === match.winnerId) {
    return match.leftPlayer;
  }
  if (match.rightPlayer.userId === match.winnerId) {
    return match.rightPlayer;
  }
  return null;
}

/**
 * 試合結果から敗者を取得
 * @param match - マッチ情報
 * @returns 敗者のPlayer情報（勝者が決まっていない場合はnull）
 */
export function getLoser(match: {
  leftPlayer: Player;
  rightPlayer: Player;
  winnerId?: number;
}): Player | null {
  if (!match.winnerId) return null;
  if (match.leftPlayer.userId === match.winnerId) {
    return match.rightPlayer;
  }
  if (match.rightPlayer.userId === match.winnerId) {
    return match.leftPlayer;
  }
  return null;
}
