import type { AssertionAuditResult } from "#audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";

/**
 * Exit `1` when any non-allowlisted type-assertion violation remains.
 *
 * @since 0.13.0
 */
export function exitCodeForAssertionAuditResult(result: AssertionAuditResult): number {
  return result.violationCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable type-assertion summary for `--json`.
 *
 * @since 0.13.0
 */
export function formatAssertionAuditJsonOutput(result: AssertionAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.violationCount === 0,
    cwd: rootDir,
    result,
  });
}
