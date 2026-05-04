import { z } from "zod";

/**
 * @since 0.3.16-canary.0
 */
export type ArrangeAnalyzeDirectoryRequest = {
  analyzeRootPath: string;
};

/**
 * @since 0.3.16-canary.0
 */
export type ArrangeSyncRunRequest = {
  rootDir: string;
  targetPath: string;
  write: boolean;
  withClassName?: boolean;
  cnImport?: string;
  config?: unknown;
};

/**
 * @since 0.3.16-canary.0
 */
export type ArrangeSuggestGroupsRequest = {
  inlineClasses: string;
  emitTvStyleArray: boolean;
  trailingClassName: boolean;
};

/**
 * @since 0.3.16-canary.0
 */
export const arrangeAnalyzeDirectoryRequestSchema: z.ZodType<ArrangeAnalyzeDirectoryRequest> =
  z.object({
    analyzeRootPath: z.string().min(1, "analyzeRootPath is required"),
  });

/**
 * @since 0.3.16-canary.0
 */
export const arrangeSyncRunRequestSchema: z.ZodType<ArrangeSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  write: z.boolean(),
  withClassName: z.boolean().optional(),
  cnImport: z.string().optional(),
  config: z.unknown().optional(),
});

/**
 * @since 0.3.16-canary.0
 */
export const arrangeSuggestGroupsRequestSchema: z.ZodType<ArrangeSuggestGroupsRequest> = z.object({
  inlineClasses: z
    .string()
    .min(1, 'Pass a class string. Example: codefast arrange group "flex gap-2 text-sm rounded-md"'),
  emitTvStyleArray: z.boolean(),
  trailingClassName: z.boolean(),
});
