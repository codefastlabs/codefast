import * as z from "zod";

/**
 * Resolved request for a single committed-bench-runs audit run.
 */
export type RunsAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly json: boolean;
};

/**
 * Zod schema for {@link RunsAuditRunRequest}.
 */
export const runsAuditRunRequestSchema: z.ZodType<RunsAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  json: z.boolean(),
});
