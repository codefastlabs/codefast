import type { PublishAuditResult } from "#audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";

/**
 * Exit `1` when any `#/` import, unshipped publish target, or unreachable stylesheet source remains.
 *
 * @since 0.12.0
 */
export function exitCodeForPublishAuditResult(result: PublishAuditResult): number {
  return isCleanPublishAudit(result) ? CLI_EXIT_SUCCESS : CLI_EXIT_GENERAL_ERROR;
}

/**
 * Machine-readable publish audit summary for `--json`.
 *
 * @since 0.12.0
 */
export function formatPublishAuditJsonOutput(result: PublishAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: isCleanPublishAudit(result),
    cwd: rootDir,
    result,
  });
}

function isCleanPublishAudit(result: PublishAuditResult): boolean {
  return result.legacyImportCount === 0 && result.unshipped.length === 0 && result.unreachableStylesheets.length === 0;
}
