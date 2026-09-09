import { z } from "zod";

/**
 * Resolved request for a single RTL audit run.
 *
 * @since 0.5.0-canary.6
 */
export type RtlAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link RtlAuditRunRequest}.
 *
 * @since 0.5.0-canary.6
 */
export const rtlAuditRunRequestSchema: z.ZodType<RtlAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
