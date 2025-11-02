import { z } from "zod";

export const UserStatsResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.number().int().positive(),
  average_score: z.number().nonnegative(),
  number_of_matches: z.number().int().nonnegative(),
  number_of_wins: z.number().int().nonnegative(),
  current_winning_streak: z.number().int().nonnegative(),
  total_score_points: z.number().int().nonnegative(),
  total_loss_points: z.number().int().nonnegative(),
  last_match_id: z.string().uuid().nullable(),
  last_updated: z.string(), // ISO 8601形式の日付文字列
});

export type UserStatsResponse = z.infer<typeof UserStatsResponseSchema>;
