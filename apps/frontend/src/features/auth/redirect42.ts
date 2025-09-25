export async function redirectTo42Auth(): Promise<void> {
    const clientId = import.meta.env.VITE_42_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_42_REDIRECT_URI;
    const state = crypto.randomUUID(); // CSRF対策のためのランダムなstateを生成
    
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "public",
        response_type: "code",
        state: state,
    });

    window.location.href = `https://api.intra.42.fr/oauth/authorize?${params.toString()}`;
};
