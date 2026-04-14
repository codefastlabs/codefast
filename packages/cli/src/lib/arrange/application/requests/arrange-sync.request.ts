import { z } from "zod";

export const ArrangeSyncRunRequestSchema = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  write: z.boolean(),
  withClassName: z.boolean().optional(),
  cnImport: z.string().optional(),
  config: z.unknown().optional(),
});

export type ArrangeSyncRunRequest = z.infer<typeof ArrangeSyncRunRequestSchema>;

export const ArrangeRunTargetRequestSchema = z.object({
  targetPath: z.string().min(1),
  write: z.boolean(),
  withClassName: z.boolean().optional(),
  cnImport: z.string().optional(),
});

export type ArrangeRunTargetRequest = z.infer<typeof ArrangeRunTargetRequestSchema>;
