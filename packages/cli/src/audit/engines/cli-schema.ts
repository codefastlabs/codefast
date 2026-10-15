import * as z from "zod";

/**
 * Resolved request for a single engines audit run.
 */
export type EnginesAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link EnginesAuditRunRequest}.
 */
export const enginesAuditRunRequestSchema: z.ZodType<EnginesAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
