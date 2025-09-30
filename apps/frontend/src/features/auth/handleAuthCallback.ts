export async function handleAuthCallback(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");

  if (!code || !state) {
    window.location.href = "/";
  }

  // CSRF対策のため、保存しておいたstateと照合
  const savedState = sessionStorage.getItem("oauth_state");
  sessionStorage.removeItem("oauth_state");
  if (!savedState || !state || savedState !== state) {
    window.location.href = "/";
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
      window.location.href = "/";
      return;
    } else {
      window.location.href = "/dashboard";
    }
  } catch (_error) {
    window.location.href = "/";
  }
}
