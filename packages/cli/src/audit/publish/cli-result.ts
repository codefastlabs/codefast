import type { PublishAuditResult } from "#audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";

/**
 * Exit `1` when any `#/` import or unshipped publish target remains.
 */
export function exitCodeForPublishAuditResult(result: PublishAuditResult): number {
  return result.legacyImportCount > 0 || result.unshipped.length > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Machine-readable publish audit summary for `--json`.
 */
export function formatPublishAuditJsonOutput(result: PublishAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.legacyImportCount === 0 && result.unshipped.length === 0,
    cwd: rootDir,
    result,
  });
}
