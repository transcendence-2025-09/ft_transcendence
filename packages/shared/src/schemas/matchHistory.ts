import { z } from "zod";

export const ScoreLogSchema = z.object({
  scored_player_id: z.number().int().positive(),
  scored_player_name: z.string(),
  current_player1_score: z.number().int().nonnegative(),
  current_player2_score: z.number().int().nonnegative(),
  elapsed_seconds: z.number().int().nonnegative().optional(),
});

export type ScoreLog = z.infer<typeof ScoreLogSchema>;

export const MatchesSchema = z.object({
  id: z.uuid(),
  tournament_id: z.uuid(),
  round: z.number().int().nonnegative(),
  player1_id: z.number().int().positive(),
  player2_id: z.number().int().positive(),
  player1_name: z.string(),
  player2_name: z.string(),
  player1_score: z.number().int().nonnegative(),
  player2_score: z.number().int().nonnegative(),
  winner_id: z.number().int().positive(),
  played_at: z.string(),
  ball_speed: z.number().int().nonnegative().optional(),
  ball_radius: z.number().int().nonnegative().optional(),
  score_logs: z.array(ScoreLogSchema).optional(),
});

export type Matches = z.infer<typeof MatchesSchema>;

export const MatchesResponseSchema = z.object({
  matches: z.array(MatchesSchema),
});

export type MatchesResponse = z.infer<typeof MatchesResponseSchema>;
