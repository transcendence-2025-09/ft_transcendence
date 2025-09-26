import "dotenv/config";
import { z } from "zod";

const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_token: z.string(),
  scope: z.string(),
  created_at: z.number(),
  secret_valid_until: z.number(),
});

export async function exchangeToken(code: string): Promise<string | null> {
  if (
    !process.env.VITE_42_CLIENT_ID ||
    !process.env.CLIENT_SECRET ||
    !process.env.VITE_42_REDIRECT_URI
  ) {
    console.error("Server configuration error");
    return null;
  }

  const params: { [key: string]: string } = {
    grant_type: "authorization_code",
    client_id: process.env.VITE_42_CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code: code,
    redirect_uri: process.env.VITE_42_REDIRECT_URI,
  };

  const formData = new FormData();
  for (const key in params) {
    formData.append(key, params[key]);
  }

  const response = await fetch("https://api.intra.42.fr/oauth/token", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error fetching token:", errorData);
    return null;
  }

  const data = await response.json();
  const parsed = tokenResponseSchema.safeParse(data);

  if (!parsed.data?.access_token) {
    console.error("No access token in response:", data);
    return null;
  }

  return parsed.data.access_token;
}
