import type { ImportsAuditResult } from "#/audit/domain/types";
import { logger } from "#/core/logger";

/**
 * Human-readable import-policy report.
 *
 * @since 0.10.0
 */
export function presentImportsAuditResult(result: ImportsAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, reason } of file.violations) {
      logger.out(`  ${line}: ${raw} → ${reason}`);
    }
  }

  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";

  if (result.violationCount > 0) {
    logger.out(`\n✖ ${result.violationCount} import-policy violation(s)${allowlistSuffix}`);
  } else {
    logger.out(`✓ No import-policy violations across ${result.scannedFileCount} file(s)${allowlistSuffix}`);
  }
}
