import type { ImportsAuditResult } from "#/audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";

/**
 * Exit `1` when any non-allowlisted import-policy violation remains.
 *
 * @since 0.10.0
 */
export function exitCodeForImportsAuditResult(result: ImportsAuditResult): number {
  return result.violationCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable import-policy summary for `--json`.
 *
 * @since 0.10.0
 */
export function formatImportsAuditJsonOutput(result: ImportsAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.violationCount === 0,
    cwd: rootDir,
    result,
  });
}
