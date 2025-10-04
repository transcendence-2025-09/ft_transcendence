/**
 * Development mock for exchangeToken
 * Always returns a mock access token
 */
export async function mockExchangeToken(code: string): Promise<string | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Validate code exists
  if (!code) {
    console.error("Mock: No code provided");
    return null;
  }

  console.log(`Mock: Exchanging code ${code} for access token`);
  return "mock_access_token_123456789";
}
