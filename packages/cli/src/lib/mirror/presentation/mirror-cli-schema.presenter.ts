import { z } from "zod";
import type { MirrorSyncRunRequest } from "#lib/mirror/application/requests/mirror-sync.request";

export const mirrorSyncRunRequestSchema: z.ZodType<MirrorSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  verbose: z.boolean().optional(),
  noColor: z.boolean().optional(),
  packageFilter: z.string().optional(),
  config: z.unknown().optional(),
});
