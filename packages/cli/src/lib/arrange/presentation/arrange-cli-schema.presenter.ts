import { z } from "zod";
import type { ArrangeAnalyzeDirectoryRequest } from "#/lib/arrange/application/requests/analyze-directory.request";
import type {
  ArrangeRunTargetRequest,
  ArrangeSyncRunRequest,
} from "#/lib/arrange/application/requests/arrange-sync.request";
import type { ArrangeSuggestGroupsRequest } from "#/lib/arrange/application/requests/suggest-groups.request";

export const arrangeAnalyzeDirectoryRequestSchema: z.ZodType<ArrangeAnalyzeDirectoryRequest> =
  z.object({
    analyzeRootPath: z.string().min(1, "analyzeRootPath is required"),
    json: z.boolean().optional(),
  });

export const arrangeSyncRunRequestSchema: z.ZodType<ArrangeSyncRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  write: z.boolean(),
  json: z.boolean().optional(),
  withClassName: z.boolean().optional(),
  cnImport: z.string().optional(),
  config: z.unknown().optional(),
});

export const arrangeRunTargetRequestSchema: z.ZodType<ArrangeRunTargetRequest> = z.object({
  targetPath: z.string().min(1),
  write: z.boolean(),
  withClassName: z.boolean().optional(),
  cnImport: z.string().optional(),
});

export const arrangeSuggestGroupsRequestSchema: z.ZodType<ArrangeSuggestGroupsRequest> = z.object({
  inlineClasses: z
    .string()
    .min(1, 'Pass a class string. Example: codefast arrange group "flex gap-2 text-sm rounded-md"'),
  emitTvStyleArray: z.boolean(),
  trailingClassName: z.boolean(),
  json: z.boolean().optional(),
});
