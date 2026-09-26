import type { AssertionAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

/**
 * Human-readable type-assertion report.
 *
 * @since 0.13.0
 */
export function presentAssertionAuditResult(result: AssertionAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, reason } of file.violations) {
      logger.out(`  ${line}: ${raw} → ${reason}`);
    }
  }

  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";

  if (result.violationCount > 0) {
    logger.out(`\n✖ ${result.violationCount} type-assertion violation(s)${allowlistSuffix}`);
  } else {
    logger.out(`✓ No double assertions across ${result.scannedFileCount} file(s)${allowlistSuffix}`);
  }
}
