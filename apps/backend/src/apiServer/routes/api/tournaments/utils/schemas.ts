import { z } from "zod";

// ===================
// 共通スキーマ
// ===================

export const ErrorSchema = z.object({ error: z.string() });

export const TournamentStatusSchema = z.enum([
  "waiting",
  "ready",
  "in_progress",
  "completed",
]);

export const PlayerSchema = z.object({
  userId: z.number(),
  alias: z.string(),
});

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

// ===================
// マッチスキーマ
// ===================

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

// ===================
// トーナメントスキーマ
// ===================

export const TournamentSchema = z.object({
  id: z.string(),
  name: z.string(),
  hostId: z.number(),
  maxPlayers: z.number(),
  players: z.array(PlayerSchema),
  status: TournamentStatusSchema,
  createdAt: z.string(),
  gameOptions: GameOptionsSchema,
});

// ===================
// リスト用スキーマ
// ===================

export const TournamentListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  hostId: z.number(),
  maxPlayers: z.number(),
  currentPlayers: z.number(),
  status: TournamentStatusSchema,
  createdAt: z.string(),
});
