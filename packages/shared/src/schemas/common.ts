import { z } from "zod";

export const PlayerSchema = z.object({
  userId: z.number(),
  alias: z.string(),
});

export type Player = z.infer<typeof PlayerSchema>;
