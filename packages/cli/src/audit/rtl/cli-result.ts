import type { RtlAuditResult } from "#/audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";

/**
 * Exit `1` when any non-allowlisted violation remains.
 *
 * @since 0.5.0-canary.6
 */
export function exitCodeForRtlAuditResult(result: RtlAuditResult): number {
  return result.violationCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable RTL audit summary for `--json`.
 *
 * @since 0.5.0-canary.6
 */
export function formatRtlAuditJsonOutput(result: RtlAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.violationCount === 0,
    cwd: rootDir,
    result,
  });
}
