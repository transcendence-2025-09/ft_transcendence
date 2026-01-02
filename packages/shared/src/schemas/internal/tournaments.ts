import { z } from "zod";

export const MatchResultRequestParamsSchema = z.object({
  id: z.string(),
  matchId: z.string(),
});

export const MatchResultScoreSchema = z.object({
  leftPlayer: z.number(),
  rightPlayer: z.number(),
});

export const MatchResultScoreLogSchema = z.object({
  left: z.number(),
  right: z.number(),
  elapsedSeconds: z.number(),
});

export const MatchResultRequestBodySchema = z.object({
  winnerId: z.number(),
  score: MatchResultScoreSchema,
  ballSpeed: z.number().optional(),
  ballRadius: z.number().optional(),
  scoreLogs: z.array(MatchResultScoreLogSchema).optional(),
});

export const MatchResultResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type MatchResultResponse = z.infer<typeof MatchResultResponseSchema>;

export const MatchResultPayloadSchema = z.object({
  tournamentId: z.string(),
  matchId: z.string(),
  winnerId: z.number(),
  score: MatchResultScoreSchema,
  ballSpeed: z.number().optional(),
  ballRadius: z.number().optional(),
  scoreLogs: z.array(MatchResultScoreLogSchema).optional(),
});

export type MatchResultPayload = z.infer<typeof MatchResultPayloadSchema>;
