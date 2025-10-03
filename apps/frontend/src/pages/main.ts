import type { ElComponent } from "../factory/componentFactory";
import { componentFactory } from "../factory/componentFactory";
import { eh } from "../factory/elementFactory";
import { pageFactory } from "../factory/pageFactory";

// import type { RouteCtx } from "../routing/routeList";

// ポップアップでOAuth認証を処理する関数
const handleOAuthWithPopup = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_42_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_42_REDIRECT_URI;

    // 環境変数の確認
    if (!clientId || !redirectUri) {
      reject(new Error("OAuth設定が不完全です。環境変数を確認してください。"));
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

// 大きなタイトル
const titleEl = eh<"h1">(
  "h1",
  { className: "text-6xl font-bold text-black mb-8" },
  "Title",
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

// 中央配置のコンテナ
const containerEl = eh<"div">(
  "div",
  {
    className:
      "min-h-screen bg-white flex flex-col justify-center items-center",
  },
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

    // ポップアップで42認証を処理
    await handleOAuthWithPopup();

    // 認証成功時の処理 - メインウィンドウでダッシュボードにリダイレクト
    console.log("認証が完了しました");
    window.location.href = "/dashboard";
  } catch (error) {
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

export const Home = pageFactory([Container]);

// export const HomeFactory = (ctx: RouteCtx) => {
//   return pageFactory([Title, Text, Link]);
// };
