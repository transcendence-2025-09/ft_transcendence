export async function mockExchangeToken(code: string): Promise<string | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (!code) {
    console.error("Mock: No code provided");
    return null;
  }

  console.log(`Mock: Exchanging code ${code} for access token`);
  return "mock_access_token_123456789";
}
