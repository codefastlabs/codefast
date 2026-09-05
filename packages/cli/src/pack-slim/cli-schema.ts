import { z } from "zod";

/**
 * Zod schema validating the serializable inputs of a pack-slim run.
 *
 * @since 0.8.1
 */
export const packSlimRunRequestSchema = z.object({
  rootDir: z.string().min(1),
  packageFilter: z.string().optional(),
  write: z.boolean().optional(),
});

/**
 * The validated serializable inputs of a pack-slim run.
 *
 * @since 0.8.1
 */
export type PackSlimRunRequest = z.infer<typeof packSlimRunRequestSchema>;
