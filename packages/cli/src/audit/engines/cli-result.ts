import type { EnginesAuditResult } from "#audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";

/**
 * Exit `1` when any Node floor breaks a rule.
 *
 * @since 0.15.0
 */
export function exitCodeForEnginesAuditResult(result: EnginesAuditResult): number {
  return result.violations.length === 0 ? CLI_EXIT_SUCCESS : CLI_EXIT_GENERAL_ERROR;
}

/**
 * Machine-readable engines audit summary for `--json`, which lists every floor so CI can plan one leg per floor.
 *
 * @since 0.15.0
 */
export function formatEnginesAuditJsonOutput(result: EnginesAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.violations.length === 0,
    cwd: rootDir,
    result,
  });
}
