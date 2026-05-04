import { z } from "zod";

export type ArrangeAnalyzeDirectoryRequest = {
  analyzeRootPath: string;
};

export type ArrangeSyncRunRequest = {
  rootDir: string;
  targetPath: string;
  write: boolean;
  withClassName?: boolean;
  cnImport?: string;
  config?: unknown;
};

export type ArrangeSuggestGroupsRequest = {
  inlineClasses: string;
  emitTvStyleArray: boolean;
  trailingClassName: boolean;
};

export const arrangeAnalyzeDirectoryRequestSchema: z.ZodType<ArrangeAnalyzeDirectoryRequest> =
  z.object({
    analyzeRootPath: z.string().min(1, "analyzeRootPath is required"),
  });

export const arrangeSyncRunRequestSchema: z.ZodType<ArrangeSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  write: z.boolean(),
  withClassName: z.boolean().optional(),
  cnImport: z.string().optional(),
  config: z.unknown().optional(),
});

export const arrangeSuggestGroupsRequestSchema: z.ZodType<ArrangeSuggestGroupsRequest> = z.object({
  inlineClasses: z
    .string()
    .min(1, 'Pass a class string. Example: codefast arrange group "flex gap-2 text-sm rounded-md"'),
  emitTvStyleArray: z.boolean(),
  trailingClassName: z.boolean(),
});
