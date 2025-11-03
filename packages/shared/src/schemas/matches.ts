import { z } from "zod";

export const MatchesResponseSchema = z.object({
  id: z.string().uuid(),
  tournament_id: z.string().uuid(),
  round: z.number().int().nonnegative(),
  player1_id: z.number().int().positive(),
  player2_id: z.number().int().positive(),
  player1_score: z.number().int().nonnegative(),
  player2_score: z.number().int().nonnegative(),
  winner_id: z.number().int().positive(),
  played_at: z.string(),
});

export type MatchesResponse = z.infer<typeof MatchesResponseSchema>;
