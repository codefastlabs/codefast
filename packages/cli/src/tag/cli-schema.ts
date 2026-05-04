import { z } from "zod";
import type { TagSyncRunRequest } from "#/tag/sync";

export const tagSyncRunRequestSchema: z.ZodType<TagSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  write: z.boolean(),
  json: z.boolean().optional(),
  targetPath: z.string().optional(),
  skipPackages: z.array(z.string()).optional(),
  config: z.unknown().optional(),
});
