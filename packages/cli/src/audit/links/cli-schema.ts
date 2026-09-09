import { z } from "zod";

/**
 * Resolved request for a single link audit run.
 *
 * @since 0.5.0
 */
export type LinkAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link LinkAuditRunRequest}.
 *
 * @since 0.5.0
 */
export const linkAuditRunRequestSchema: z.ZodType<LinkAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
