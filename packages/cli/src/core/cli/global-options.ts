import { z } from "zod";

/**
 * Commander global opts shape validated before mirror prelude (`color` from `--no-color`).
 *
 * @since 0.3.16-canary.0
 */
export const globalCliCommanderOptionsSchema = z.object({
  color: z.boolean().optional(),
});

/**
 * @since 0.3.16-canary.0
 */
export type GlobalCliOptions = z.infer<typeof globalCliCommanderOptionsSchema>;
