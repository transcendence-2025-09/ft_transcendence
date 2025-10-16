import { Type } from "@fastify/type-provider-typebox";

// 共通スキーマ定義
export const ErrorSchema = Type.Object({ error: Type.String() });

export const TournamentStatusSchema = Type.Union([
  Type.Literal("waiting"),
  Type.Literal("ready"),
  Type.Literal("in_progress"),
  Type.Literal("completed"),
]);

export const PlayerSchema = Type.Object({
  userId: Type.Number(),
  alias: Type.String(),
});

export const MatchStatusSchema = Type.Union([
  Type.Literal("pending"),
  Type.Literal("in_progress"),
  Type.Literal("completed"),
]);

export const MatchRoundSchema = Type.Union([
  Type.Literal("semifinals"),
  Type.Literal("finals"),
  Type.Literal("third_place"),
]);

export const GameOptionsSchema = Type.Object({
  ballSpeed: Type.Number(),
  ballRadius: Type.Number(),
});

export const MatchSchema = Type.Object({
  id: Type.String(),
  round: MatchRoundSchema,
  leftPlayer: PlayerSchema,
  rightPlayer: PlayerSchema,
  status: MatchStatusSchema,
  score: Type.Optional(
    Type.Object({
      leftPlayer: Type.Number(),
      rightPlayer: Type.Number(),
    }),
  ),
  gameOptions: GameOptionsSchema,
});

export const TournamentSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  hostId: Type.Number(),
  maxPlayers: Type.Number(),
  players: Type.Array(PlayerSchema),
  status: TournamentStatusSchema,
  createdAt: Type.String(),
  gameOptions: GameOptionsSchema,
});
