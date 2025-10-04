import type { UserData } from "./fetchUserData.js";

/**
 * Development mock for fetchUserData
 * Returns a mock user object
 */
export async function mockFetchUserData(
  accessToken: string,
): Promise<UserData | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (!accessToken) {
    console.error("Mock: No access token provided");
    return null;
  }

  console.log(`Mock: Fetching user data with token ${accessToken}`);

  // Return mock user data
  return {
    id: 12345,
    email: "mock.user@student.42.fr",
    login: "mockuser",
    image: {
      link: "https://cdn.intra.42.fr/users/default.jpg",
    },
  };
}
