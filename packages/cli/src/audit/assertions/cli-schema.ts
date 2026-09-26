import * as z from "zod";

/**
 * Resolved request for a single type-assertion audit run.
 *
 * @since 0.13.0
 */
export type AssertionAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link AssertionAuditRunRequest}.
 *
 * @since 0.13.0
 */
export const assertionAuditRunRequestSchema: z.ZodType<AssertionAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
