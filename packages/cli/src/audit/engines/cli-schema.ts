import * as z from "zod";

/**
 * Resolved request for a single engines audit run.
 *
 * @since 0.15.0
 */
export type EnginesAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link EnginesAuditRunRequest}.
 *
 * @since 0.15.0
 */
export const enginesAuditRunRequestSchema: z.ZodType<EnginesAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
