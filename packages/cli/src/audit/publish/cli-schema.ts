import * as z from "zod";

/**
 * Resolved request for a single publish audit run.
 */
export type PublishAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly json: boolean;
};

/**
 * Zod schema for {@link PublishAuditRunRequest}.
 */
export const publishAuditRunRequestSchema: z.ZodType<PublishAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});
