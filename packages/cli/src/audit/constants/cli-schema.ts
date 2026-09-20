import * as z from "zod";

/**
 * Resolved request for a single numeric-constant audit run.
 *
 * @since 0.11.0
 */
export type ConstantAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link ConstantAuditRunRequest}.
 *
 * @since 0.11.0
 */
export const constantAuditRunRequestSchema: z.ZodType<ConstantAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
