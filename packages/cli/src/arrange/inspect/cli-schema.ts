import { z } from "zod";

/**
 * The request payload for `arrange inspect`.
 *
 * @since 0.3.16-canary.0
 */
export type ArrangeAnalyzeDirectoryRequest = {
  analyzeRootPath: string;
};

/**
 * The `zod` schema validating an `arrange inspect` request.
 *
 * @since 0.3.16-canary.0
 */
export const arrangeAnalyzeDirectoryRequestSchema: z.ZodType<ArrangeAnalyzeDirectoryRequest> = z.object({
  analyzeRootPath: z.string().min(1, "analyzeRootPath is required"),
});
