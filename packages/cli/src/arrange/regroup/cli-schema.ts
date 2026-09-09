import { z } from "zod";

/**
 * The request payload for a top-level `arrange` run.
 *
 * @since 0.3.16-canary.0
 */
export type ArrangeSyncRunRequest = {
  rootDir: string;
  targetPath: string;
  write: boolean;
  withClassName?: boolean | undefined;
  cnImport?: string | undefined;
  config?: unknown;
};

/**
 * The `zod` schema validating an `arrange` run request.
 *
 * @since 0.3.16-canary.0
 */
export const arrangeSyncRunRequestSchema: z.ZodType<ArrangeSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  write: z.boolean(),
  withClassName: z.boolean().optional(),
  cnImport: z.string().optional(),
  config: z.unknown().optional(),
});
