import { z } from "zod";
import type { MirrorSyncRunRequest } from "#/mirror/sync-types";

export const mirrorSyncRunRequestSchema: z.ZodType<MirrorSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  packageFilter: z.string().optional(),
  config: z.unknown().optional(),
});
