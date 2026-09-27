import type { LayersAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

/**
 * Human-readable layering report.
 *
 * @since 0.14.0
 */
export function presentLayersAuditResult(result: LayersAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, reason } of file.violations) {
      logger.out(`  ${line}: ${raw} → ${reason}`);
    }
  }

  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";

  if (result.violationCount > 0) {
    logger.out(`\n✖ ${result.violationCount} layering violation(s)${allowlistSuffix}`);
  } else {
    logger.out(
      `✓ Every value import points down the layers across ${result.scannedFileCount} file(s) in ${result.packageCount} package(s)${allowlistSuffix}`,
    );
  }
}
