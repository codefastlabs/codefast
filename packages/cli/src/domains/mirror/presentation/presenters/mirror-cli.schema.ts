import { z } from "zod";
import type { MirrorSyncRunRequest } from "#/domains/mirror/application/requests/mirror-sync.request";

export const mirrorSyncRunRequestSchema: z.ZodType<MirrorSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  packageFilter: z.string().optional(),
  config: z.unknown().optional(),
});
