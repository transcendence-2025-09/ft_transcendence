export async function get2faQrCode() {
  const response = await fetch("/api/auth/2fa/generate");
  if (!response.ok) {
    throw new Error("Failed to get 2FA QR code");
  }
  return response.json();
}
