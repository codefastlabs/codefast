import { z } from "zod";

/**
 * Resolved request for a single import-policy audit run.
 *
 * @since 0.10.0
 */
export type ImportsAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link ImportsAuditRunRequest}.
 *
 * @since 0.10.0
 */
export const importsAuditRunRequestSchema: z.ZodType<ImportsAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
