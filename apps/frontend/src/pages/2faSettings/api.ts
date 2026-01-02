export async function get2faQrCode(): Promise<{
  otpauthUrl: string;
  qrCode: string;
}> {
  const response = await fetch("/api/auth/2fa/generate", {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error((await response.json()).error);
  }
  return await response.json();
}

export async function enable2fa(code: string): Promise<void> {
  const response = await fetch("/api/auth/2fa/enable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ twoFactorToken: code }),
  });
  if (!response.ok) {
    throw new Error((await response.json()).error);
  }
}

export async function disable2fa(code: string): Promise<void> {
  const response = await fetch("/api/auth/2fa/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ twoFactorToken: code }),
  });
  if (!response.ok) {
    throw new Error((await response.json()).error);
  }
}
