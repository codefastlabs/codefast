import { z } from "zod";

/** Commander global opts shape validated before mirror prelude (`color` from `--no-color`). */
export const globalCliCommanderOptionsSchema = z.object({
  color: z.boolean().optional(),
});

export type GlobalCliOptions = z.infer<typeof globalCliCommanderOptionsSchema>;
