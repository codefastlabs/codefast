import type { ConstantAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

/**
 * Human-readable numeric-constant report.
 *
 * @since 0.11.0
 */
export function presentConstantAuditResult(result: ConstantAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, reason } of file.violations) {
      logger.out(`  ${line}: ${raw} → ${reason}`);
    }
  }
  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";
  if (result.violationCount > 0) {
    logger.out(`\n✖ ${result.violationCount} numeric constant(s) with no kind named${allowlistSuffix}`);
  } else {
    logger.out(
      `✓ Every numeric constant names its kind across ${result.scannedFileCount} source file(s)${allowlistSuffix}`,
    );
  }
}
