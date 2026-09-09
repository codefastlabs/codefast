import type { DisplayNameAuditResult } from "#/audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";

/**
 * Exit `1` when any non-allowlisted display-name violation remains.
 *
 * @since 0.9.0
 */
export function exitCodeForDisplayNameAuditResult(result: DisplayNameAuditResult): number {
  return result.violationCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable display-name summary for `--json`.
 *
 * @since 0.9.0
 */
export function formatDisplayNameAuditJsonOutput(result: DisplayNameAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.violationCount === 0,
    cwd: rootDir,
    result,
  });
}
