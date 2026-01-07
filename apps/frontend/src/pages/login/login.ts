import { componentFactory, type ElComponent, pageFactory } from "@/factory";
import { ensureAuth, type RouteCtx } from "@/routing";
import { TwoFactorRequiredError } from "@/utils/errors";
import { handleOAuthWithPopup, mockLogin } from "./services";

export const Login = async (ctx: RouteCtx): Promise<ElComponent> => {
  // 既にログイン済みの場合はダッシュボードへリダイレクト
  const isLoggedIn = await ensureAuth();
  if (isLoggedIn) {
    window.location.href = "/dashboard";
    // リダイレクト中は空のコンポーネントを返す
    const emptyDiv = document.createElement("div");
    return pageFactory([componentFactory(emptyDiv)]);
  }

  const nextUrl = ctx.query.get("next");

  const el = document.createElement("div");
  el.innerHTML = `
    <div class="min-h-screen bg-white flex flex-col justify-center items-center">
      ${
        nextUrl
          ? `
        <div id="loginBanner" class="fixed top-0 left-0 right-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-center shadow-sm">
          <span>ログインしていないか、セッションが切れました。再度ログインしてください。</span>
          <button type="button" id="bannerCloseBtn" class="ml-4 text-amber-600 hover:text-amber-800 transition-colors" aria-label="閉じる">✕</button>
        </div>
      `
          : ""
      }
      
      <h1 class="text-6xl font-bold text-black mb-8">ft_transcendence</h1>
      <button id="signInBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
        Sign in with 42
      </button>
    </div>
  `;

  // バナークローズボタンのイベントリスナー
  const bannerCloseBtn = el.querySelector(
    "#bannerCloseBtn",
  ) as HTMLButtonElement | null;
  if (bannerCloseBtn) {
    bannerCloseBtn.addEventListener("click", () => {
      const banner = el.querySelector("#loginBanner");
      if (banner) banner.classList.add("hidden");
    });
  }

  // Sign in ボタンのイベントリスナー
  const signInBtn = el.querySelector("#signInBtn") as HTMLButtonElement;
  signInBtn.addEventListener("click", async () => {
    // 既に処理中の場合は何もしない
    if (signInBtn.disabled) return;

    const originalText = signInBtn.textContent;
    const originalClassName = signInBtn.className;

    try {
      // ボタンを無効化
      signInBtn.disabled = true;
      signInBtn.textContent = "サインイン中...";
      signInBtn.className =
        "bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg cursor-not-allowed opacity-50";

      // 開発環境ではモック認証、本番環境では42認証
      if (import.meta.env.DEV) {
        await mockLogin();
      } else {
        await handleOAuthWithPopup();
      }

      // 認証成功時の処理 - next パラメータがあればそこへ、なければダッシュボードへ
      console.log("認証が完了しました");
      window.location.href = nextUrl
        ? decodeURIComponent(nextUrl)
        : "/dashboard";
    } catch (error) {
      // 2FA が必要な場合は検証ページへ
      if (error instanceof TwoFactorRequiredError) {
        window.location.href = "/auth/2fa/validate";
        return;
      }

      console.error("認証エラー:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "認証に失敗しました。もう一度お試しください。";
      alert(errorMessage);

      // ボタンを元に戻す
      signInBtn.disabled = false;
      signInBtn.textContent = originalText;
      signInBtn.className = originalClassName;
    }
  });

  return pageFactory([componentFactory(el)]);
};
