import { z } from "zod";

const userResponseSchema = z.object({
  id: z.number(),
  email: z.email(),
  login: z.string(),
  image: z.object({
    link: z.url(),
  }),
});

type FtUserData = z.infer<typeof userResponseSchema>;

export async function fetchFtUserData(
  accessToken: string,
): Promise<FtUserData | null> {
  const response = await fetch("https://api.intra.42.fr/v2/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error fetching user data:", errorData);
    return null;
  }

  const data = await response.json();
  const parsed = userResponseSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Invalid user data format:", parsed.error);
    return null;
  }

  return parsed.data;
}
