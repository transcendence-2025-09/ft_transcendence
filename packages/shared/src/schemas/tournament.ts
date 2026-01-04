import { z } from "zod";
import { PlayerSchema } from "./common.js";
import { GameOptionsSchema, MatchSchema } from "./match.js";

export const TournamentStatusSchema = z.enum([
  "waiting",
  "ready",
  "in_progress",
  "completed",
]);

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

export const TournamentListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  hostId: z.number(),
  maxPlayers: z.number(),
  currentPlayers: z.number(),
  status: TournamentStatusSchema,
  createdAt: z.string(),
});

export const TournamentResponseSchema = z.object({
  tournament: TournamentSchema,
});

export const TournamentListResponseSchema = z.array(TournamentListItemSchema);

export const TournamentMatchesResponseSchema = z.object({
  matches: z.array(MatchSchema),
});

export const MatchResponseSchema = z.object({
  match: MatchSchema,
  tournament: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export const CreateTournamentResponseSchema = z.object({
  tournamentId: z.string(),
});

export const JoinTournamentResponseSchema = z.object({
  success: z.boolean(),
  tournament: TournamentSchema,
});

export const CancelTournamentResponseSchema = z.object({
  success: z.boolean(),
  tournament: TournamentSchema,
});

export type TournamentStatus = z.infer<typeof TournamentStatusSchema>;
export type Tournament = z.infer<typeof TournamentSchema>;
export type TournamentListItem = z.infer<typeof TournamentListItemSchema>;
export type JoinTournamentResponse = z.infer<
  typeof JoinTournamentResponseSchema
>;
export type CancelTournamentResponse = z.infer<
  typeof CancelTournamentResponseSchema
>;
