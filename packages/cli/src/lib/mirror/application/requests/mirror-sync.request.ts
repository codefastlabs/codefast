import { z } from "zod";

export const MirrorSyncRunRequestSchema = z.object({
  rootDir: z.string().min(1),
  verbose: z.boolean().optional(),
  noColor: z.boolean().optional(),
  packageFilter: z.string().optional(),
  config: z.unknown().optional(),
});

export type MirrorSyncRunRequest = z.infer<typeof MirrorSyncRunRequestSchema>;
