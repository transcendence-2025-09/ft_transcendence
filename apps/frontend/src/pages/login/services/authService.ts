import {
  AuthCancelledError,
  AuthFailedError,
  AuthTimeoutError,
  OAuthConfigError,
  PopupBlockedError,
  TwoFactorRequiredError,
} from "@/utils/errors";

// ポップアップでOAuth認証を処理する関数
export const handleOAuthWithPopup = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_42_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_42_REDIRECT_URI;

    // 環境変数の確認
    if (!clientId || !redirectUri) {
      reject(new OAuthConfigError());
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
      reject(new PopupBlockedError());
      return;
    }

    // ポップアップの監視
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", messageListener);
        // ポップアップが閉じられた場合、キャンセルと見なす
        reject(new AuthCancelledError());
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
        reject(new AuthFailedError());
      }
    };

    window.addEventListener("message", messageListener);

    // タイムアウト処理（30秒）
    setTimeout(() => {
      if (!popup.closed) {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener("message", messageListener);
        reject(new AuthTimeoutError());
      }
    }, 30000);
  });
};

export async function mockLogin(): Promise<void> {
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
