import type { PropsAuditResult } from "#audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";

/**
 * Exit `1` when any non-allowlisted props-declaration violation remains.
 */
export function exitCodeForPropsAuditResult(result: PropsAuditResult): number {
  return result.violationCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable props-declaration summary for `--json`.
 */
export function formatPropsAuditJsonOutput(result: PropsAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.violationCount === 0,
    cwd: rootDir,
    result,
  });
}
