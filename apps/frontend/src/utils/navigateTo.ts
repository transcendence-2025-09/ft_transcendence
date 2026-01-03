/**
 * SPAルーターを使用してURLに遷移
 * @param url - 遷移先のURL
 */
export function navigateTo(url: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.click();
}
