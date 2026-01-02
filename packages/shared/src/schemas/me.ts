import { z } from "zod";

export const MeResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.email(),
  ft_id: z.number().int().positive(),
  two_factor_enabled: z.boolean(),
});

export type MeResponse = z.infer<typeof MeResponseSchema>;
