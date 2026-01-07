import { componentFactory, type ElComponent, eh, pageFactory } from "@/factory";
import { ensureAuth, type RouteCtx } from "@/routing";
import { TwoFactorRequiredError } from "@/utils/errors";
import { handleOAuthWithPopup, mockLogin } from "./services";

export const Login = async (ctx: RouteCtx): Promise<ElComponent> => {
  // 既にログイン済みの場合はダッシュボードへリダイレクト
  const isLoggedIn = await ensureAuth();
  if (isLoggedIn) {
    window.location.href = "/dashboard";
    // リダイレクト中は空のコンポーネントを返す
    return pageFactory([componentFactory(eh("div"))]);
  }

  const nextUrl = ctx.query.get("next");

  // 大きなタイトル
  const titleEl = eh<"h1">(
    "h1",
    { className: "text-6xl font-bold text-black mb-8" },
    "ft_transcendence",
  );

  // Sign in with 42 ボタン
  const signInButtonEl = eh<"button">(
    "button",
    {
      className:
        "bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200",
    },
    "Sign in with 42",
  );

  // --- ログイン要求バナー ---
  const bannerCloseButtonEl = eh(
    "button",
    {
      type: "button",
      className: "ml-4 text-amber-600 hover:text-amber-800 transition-colors",
      "aria-label": "閉じる",
    },
    "✕",
  );

  const loginRequiredBannerEl = eh(
    "div",
    {
      className: nextUrl
        ? "fixed top-0 left-0 right-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-center shadow-sm"
        : "hidden",
    },
    eh(
      "span",
      {},
      "ログインしていないか、セッションが切れました。再度ログインしてください。",
    ),
    bannerCloseButtonEl,
  );

  bannerCloseButtonEl.addEventListener("click", () => {
    loginRequiredBannerEl.classList.add("hidden");
  });

  // 中央配置のコンテナ
  const containerEl = eh<"div">(
    "div",
    {
      className:
        "min-h-screen bg-white flex flex-col justify-center items-center",
    },
    loginRequiredBannerEl,
    titleEl,
    signInButtonEl,
  );

  const Container: ElComponent = componentFactory(containerEl);

  // Sign in ボタンにイベントリスナーを追加
  signInButtonEl.addEventListener("click", async () => {
    // 既に処理中の場合は何もしない
    if (signInButtonEl.disabled) return;

    const originalText = signInButtonEl.textContent;
    const originalClassName = signInButtonEl.className;

    try {
      // ボタンを無効化
      signInButtonEl.disabled = true;
      signInButtonEl.textContent = "サインイン中...";
      signInButtonEl.className =
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
      signInButtonEl.disabled = false;
      signInButtonEl.textContent = originalText;
      signInButtonEl.className = originalClassName;
    }
  });

  return pageFactory([Container]);
};
