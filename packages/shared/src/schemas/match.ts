import { z } from "zod";
import { PlayerSchema } from "./common.js";

export const MatchStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
]);

export const MatchRoundSchema = z.enum(["semifinals", "finals", "third_place"]);

export const GameOptionsSchema = z.object({
  ballSpeed: z.number(),
  ballRadius: z.number(),
});

export const ScoreSchema = z.object({
  leftPlayer: z.number(),
  rightPlayer: z.number(),
});

export const MatchSchema = z.object({
  id: z.string(),
  round: MatchRoundSchema,
  leftPlayer: PlayerSchema,
  rightPlayer: PlayerSchema,
  status: MatchStatusSchema,
  score: ScoreSchema.optional(),
  winnerId: z.number().optional(),
  gameOptions: GameOptionsSchema,
});

export const MatchListResponseSchema = z.object({
  matches: z.array(MatchSchema),
});

export const MatchStartResponseSchema = z.object({
  success: z.boolean(),
  matchId: z.string(),
});

export type MatchStatus = z.infer<typeof MatchStatusSchema>;
export type MatchRound = z.infer<typeof MatchRoundSchema>;
export type GameOptions = z.infer<typeof GameOptionsSchema>;
export type Score = z.infer<typeof ScoreSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type MatchListResponse = z.infer<typeof MatchListResponseSchema>;
export type MatchStartResponse = z.infer<typeof MatchStartResponseSchema>;
