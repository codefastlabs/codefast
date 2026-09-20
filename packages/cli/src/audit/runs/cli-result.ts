import type { RunsAuditResult } from "#audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";

/**
 * Exit `1` when any committed-bench-run finding remains.
 */
export function exitCodeForRunsAuditResult(result: RunsAuditResult): number {
  return result.findingCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable committed-bench-runs summary for `--json`.
 */
export function formatRunsAuditJsonOutput(result: RunsAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.findingCount === 0,
    cwd: rootDir,
    result,
  });
}
