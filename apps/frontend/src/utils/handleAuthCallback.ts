import type { RouteCtx } from "@/routing/routeList";

export async function handleAuthCallback(_ctx: RouteCtx) {
  const result = await authCallback();

  if (window.opener) {
    window.opener.postMessage({ type: result }, window.location.origin);
    window.close();
    return undefined;
  }
  return undefined;
}

async function authCallback(): Promise<
  "AUTH_SUCCESS" | "AUTH_ERROR" | "AUTH_2FA_REQUIRED"
> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) {
    return "AUTH_ERROR";
  }

  // CSRF対策のため、保存しておいたstateと照合
  const savedState = sessionStorage.getItem("oauth_state");
  sessionStorage.removeItem("oauth_state");
  if (!savedState || !state || savedState !== state) {
    return "AUTH_ERROR";
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      return "AUTH_ERROR";
    } else {
      const data: { needTwoFactor: boolean } = await response.json();
      if (data.needTwoFactor) {
        return "AUTH_2FA_REQUIRED";
      } else {
        return "AUTH_SUCCESS";
      }
    }
  } catch (_error) {
    return "AUTH_ERROR";
  }
}
