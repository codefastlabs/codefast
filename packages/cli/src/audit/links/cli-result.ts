import type { LinkAuditResult } from "#/audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";

/**
 * Exit `1` when any non-allowlisted broken link remains.
 *
 * @since 0.5.0
 */
export function exitCodeForLinkAuditResult(result: LinkAuditResult): number {
  return result.breakageCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable link audit summary for `--json`.
 *
 * @since 0.5.0
 */
export function formatLinkAuditJsonOutput(result: LinkAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.breakageCount === 0,
    cwd: rootDir,
    result,
  });
}
