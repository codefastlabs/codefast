import { z } from "zod";
import type { TagSyncRunRequest } from "#lib/tag/application/requests/tag-sync.request";

export const TagSyncRunRequestSchema: z.ZodType<TagSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  write: z.boolean(),
  targetPath: z.string().optional(),
  skipPackages: z.array(z.string()).optional(),
  config: z.unknown().optional(),
});
