import type { CommentAuditResult } from "#/audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";

/**
 * Exit `1` when any non-allowlisted divider still breaks the convention.
 *
 * @since 0.6.0
 */
export function exitCodeForCommentAuditResult(result: CommentAuditResult): number {
  return result.breakageCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable comment-divider summary for `--json`.
 *
 * @since 0.6.0
 */
export function formatCommentAuditJsonOutput(result: CommentAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.breakageCount === 0,
    cwd: rootDir,
    result,
  });
}
