import { z } from "zod";

/**
 * Resolved request for a single comment-divider audit run.
 *
 * @since 0.6.0
 */
export type CommentAuditRunRequest = {
  readonly rootDir: string;
  readonly targetPath: string;
  readonly allowlist?: ReadonlyArray<string> | undefined;
  readonly fix: boolean;
  readonly json: boolean;
};

/**
 * Zod schema for {@link CommentAuditRunRequest}.
 *
 * @since 0.6.0
 */
export const commentAuditRunRequestSchema: z.ZodType<CommentAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  fix: z.boolean(),
  json: z.boolean(),
});
