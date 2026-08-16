import path from "node:path";

import { z } from "zod";

/**
 * Resolved request for a single RTL audit run.
 *
 * @since 1.0.0-canary.7
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
 * @since 1.0.0-canary.7
 */
export const rtlAuditRunRequestSchema: z.ZodType<RtlAuditRunRequest> = z.object({
  rootDir: z.string().min(1),
  targetPath: z.string().min(1),
  allowlist: z.array(z.string()).optional(),
  json: z.boolean(),
});

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

/**
 * Resolves a path that may be absolute or relative to `rootDir`.
 *
 * @since 1.0.0-canary.7
 */
export function resolveRepoRelativePath(rootDir: string, maybeRelative: string): string {
  return path.isAbsolute(maybeRelative) ? path.resolve(maybeRelative) : path.resolve(rootDir, maybeRelative);
}
