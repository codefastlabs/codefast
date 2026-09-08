import { z } from "zod";

/**
 * The validated global CLI options shared by every subcommand.
 *
 * @since 0.3.16-canary.0
 */
export interface GlobalCliOptions {
  color?: boolean | undefined;
}

/**
 * Commander global opts shape validated before mirror prelude (`color` from `--no-color`).
 *
 * @since 0.3.16-canary.0
 */
export const globalCliCommanderOptionsSchema: z.ZodType<GlobalCliOptions> = z.object({
  color: z.boolean().optional(),
});
