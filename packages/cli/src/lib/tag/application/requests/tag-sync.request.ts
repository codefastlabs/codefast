import { z } from "zod";

export const TagSyncRunRequestSchema = z.object({
  rootDir: z.string().min(1),
  write: z.boolean(),
  targetPath: z.string().optional(),
  skipPackages: z.array(z.string()).optional(),
  config: z.unknown().optional(),
});

export type TagSyncRunRequest = z.infer<typeof TagSyncRunRequestSchema>;
