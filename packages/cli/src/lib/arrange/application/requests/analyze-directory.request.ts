import { z } from "zod";

export const ArrangeAnalyzeDirectoryRequestSchema = z.object({
  analyzeRootPath: z.string().min(1, "analyzeRootPath is required"),
});

export type ArrangeAnalyzeDirectoryRequest = z.infer<typeof ArrangeAnalyzeDirectoryRequestSchema>;
