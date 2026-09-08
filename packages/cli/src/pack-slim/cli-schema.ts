import { z } from "zod";

/**
 * The validated serializable inputs of a pack-slim run.
 *
 * @since 0.8.1
 */
export interface PackSlimRunRequest {
  rootDir: string;
  packageFilter?: string | undefined;
  write?: boolean | undefined;
}

/**
 * Zod schema validating the serializable inputs of a pack-slim run.
 *
 * @since 0.8.1
 */
export const packSlimRunRequestSchema: z.ZodType<PackSlimRunRequest> = z.object({
  rootDir: z.string().min(1),
  packageFilter: z.string().optional(),
  write: z.boolean().optional(),
});
