import { ERROR_MESSAGES, STATUS_LABELS } from "./constants";

/**
 * ステータスの日本語ラベルを取得
 * @param status - ステータス文字列
 * @returns 日本語ラベル（存在しない場合は元の文字列）
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

/**
 * SPAルーターを使用してURLに遷移
 * @param url - 遷移先のURL
 */
export function navigateTo(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.click();
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
