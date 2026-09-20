import type { ConstantAuditResult } from "#audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";

/**
 * Exit `1` when any non-allowlisted numeric constant is unlabelled.
 *
 * @since 0.11.0
 */
export function exitCodeForConstantAuditResult(result: ConstantAuditResult): number {
  return result.violationCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable numeric-constant summary for `--json`.
 *
 * @since 0.11.0
 */
export function formatConstantAuditJsonOutput(result: ConstantAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.violationCount === 0,
    cwd: rootDir,
    result,
  });
}
