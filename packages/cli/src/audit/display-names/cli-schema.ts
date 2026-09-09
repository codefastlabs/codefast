import * as z from "zod";

/**
 * Resolved request for a single display-name audit run.
 *
 * @since 0.9.0
 */
export type DisplayNameAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link DisplayNameAuditRunRequest}.
 *
 * @since 0.9.0
 */
export const displayNameAuditRunRequestSchema: z.ZodType<DisplayNameAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
