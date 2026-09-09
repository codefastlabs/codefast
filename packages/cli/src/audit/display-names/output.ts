import type { DisplayNameAuditResult } from "#/audit/domain/types";
import { logger } from "#/core/logger";

/**
 * Human-readable display-name report.
 *
 * @since 0.9.0
 */
export function presentDisplayNameAuditResult(result: DisplayNameAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, reason } of file.violations) {
      logger.out(`  ${line}: ${raw} → ${reason}`);
    }
  }

  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";

  if (result.violationCount > 0) {
    logger.out(`\n✖ ${result.violationCount} display name(s) off the convention${allowlistSuffix}`);
  } else {
    logger.out(
      `✓ Every token, tag and module display name follows <namespace>:<Name> across ${result.scannedFileCount} file(s)${allowlistSuffix}`,
    );
  }
}
