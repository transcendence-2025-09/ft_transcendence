import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";
import { pageFactory } from "../factory/pageFactory";
import type { RouteCtx } from "../routing/routeList";
import { ensureAuth } from "../routing/router";

class TwoFactorRequiredError extends Error {
  constructor() {
    super("Two-factor authentication required");
    this.name = "TwoFactorRequiredError";
  }
}

// ポップアップでOAuth認証を処理する関数
const handleOAuthWithPopup = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_42_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_42_REDIRECT_URI;

    // 環境変数の確認
    if (!clientId || !redirectUri) {
      reject(
        new Error(
          `OAuth設定が不完全です。環境変数を確認してください。clientId: ${clientId}, redirectUri: ${redirectUri}`,
        ),
      );
      return;
    }

    const state = crypto.randomUUID();

    // セッションストレージに状態を保存
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "public",
      response_type: "code",
      state: state,
    });

    const authUrl = `https://api.intra.42.fr/oauth/authorize?${params.toString()}`;

    // ポップアップウィンドウを開く
    const popup = window.open(
      authUrl,
      "42auth",
      "width=500,height=600,scrollbars=yes,resizable=yes",
    );

    if (!popup) {
      reject(new Error("ポップアップがブロックされました"));
      return;
    }

    // ポップアップの監視
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageListener);
        // ポップアップが閉じられた場合、キャンセルと見なす
        reject(new Error("認証がキャンセルされました"));
      }
    }, 1000);

    // メッセージリスナー（認証完了通知用）
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "AUTH_SUCCESS") {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener("message", messageListener);
        // 少し遅延を入れてからresolveして、確実にクッキーが設定されるのを待つ
        setTimeout(() => {
          resolve();
        }, 100);
      } else if (event.data.type === "AUTH_2FA_REQUIRED") {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener("message", messageListener);
        reject(new TwoFactorRequiredError());
      } else if (event.data.type === "AUTH_ERROR") {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener("message", messageListener);
        reject(new Error(event.data.error || "認証に失敗しました"));
      }
    };

    window.addEventListener("message", messageListener);

    // タイムアウト処理（30秒）
    setTimeout(() => {
      if (!popup.closed) {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener("message", messageListener);
        reject(new Error("認証がタイムアウトしました"));
      }
    }, 30000);
  });
};

async function mockLogin(): Promise<void> {
  return new Promise((resolve, reject) => {
    // ポップアップ用のHTMLを作成
    const popupHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mock Login</title>
        </head>
        <body>
          <div>
            <h2>Mock Login</h2>
            <form id="mockLoginForm">
              <div>
                <label for="username">Username:</label>
                <input type="text" id="username" name="username" required>
              </div>
              <div>
                <button type="submit">Submit</button>
                <button type="button" id="cancelBtn">Cancel</button>
              </div>
            </form>
          </div>
        </body>
      </html>
    `;

    // ポップアップウィンドウを開く
    const popup = window.open(
      "",
      "mockauth",
      "width=400,height=300,scrollbars=yes,resizable=yes",
    );

    if (!popup) {
      reject(new Error("ポップアップがブロックされました"));
      return;
    }

    // ポップアップにHTMLを書き込み
    popup.document.write(popupHtml);
    popup.document.close();

    // ポップアップの監視
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error("認証がキャンセルされました"));
      }
    }, 1000);

    // ポップアップ内のフォームにイベントリスナーを追加
    const form = popup.document.getElementById(
      "mockLoginForm",
    ) as HTMLFormElement;
    const cancelBtn = popup.document.getElementById(
      "cancelBtn",
    ) as HTMLButtonElement;

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const username = formData.get("username") as string;

        try {
          const response = await fetch("/api/auth/mock-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: username,
            }),
          });

          if (!response.ok) {
            throw new Error("Mock login failed");
          }

          clearInterval(checkClosed);
          popup.close();
          resolve();
        } catch (error) {
          clearInterval(checkClosed);
          popup.close();
          reject(error);
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        clearInterval(checkClosed);
        popup.close();
        reject(new Error("認証がキャンセルされました"));
      });
    }

    // タイムアウト処理（30秒）
    setTimeout(() => {
      if (!popup.closed) {
        clearInterval(checkClosed);
        popup.close();
        reject(new Error("認証がタイムアウトしました"));
      }
    }, 30000);
  });
}

export const Home = async (ctx: RouteCtx): Promise<ElComponent> => {
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
