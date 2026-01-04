import { z } from "zod";

export const PlayerSchema = z.object({
  userId: z.number(),
  alias: z.string(),
});

export type Player = z.infer<typeof PlayerSchema>;

// 共通レスポンススキーマ
export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

export const SuccessMessageResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type SuccessMessageResponse = z.infer<
  typeof SuccessMessageResponseSchema
>;
