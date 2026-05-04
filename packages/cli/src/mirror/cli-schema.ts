import { z } from "zod";
import type { MirrorSyncRunRequest } from "#/mirror/sync-types";

/**
 * @since 0.3.16-canary.0
 */
export const mirrorSyncRunRequestSchema: z.ZodType<MirrorSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  packageFilter: z.string().optional(),
  config: z.unknown().optional(),
});
