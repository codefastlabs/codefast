import * as z from "zod";

/**
 * Resolved request for a single props-declaration audit run.
 *
 * @since 0.15.0
 */
export type PropsAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link PropsAuditRunRequest}.
 *
 * @since 0.15.0
 */
export const propsAuditRunRequestSchema: z.ZodType<PropsAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
