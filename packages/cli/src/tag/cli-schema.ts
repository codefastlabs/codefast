import * as z from "zod";

import type { TagRunRequest } from "#/tag/domain/types";

/**
 * Zod schema validating a `TagRunRequest`.
 *
 * @since 0.3.16-canary.0
 */
export const tagRunRequestSchema: z.ZodType<TagRunRequest> = z.object({
  rootDir: z.string().min(1),
  write: z.boolean(),
  json: z.boolean().optional(),
  targetPath: z.string().optional(),
  skipPackages: z.array(z.string()).optional(),
  config: z.unknown().optional(),
});
