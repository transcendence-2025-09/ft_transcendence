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

export const TournamentSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  hostId: Type.Number(),
  maxPlayers: Type.Number(),
  players: Type.Array(PlayerSchema),
  status: TournamentStatusSchema,
  createdAt: Type.String(),
});
