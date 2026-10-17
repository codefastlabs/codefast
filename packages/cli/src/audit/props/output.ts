import type { PropsAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

/**
 * Human-readable props-declaration report.
 *
 * @since 0.15.0
 */
export function presentPropsAuditResult(result: PropsAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, reason } of file.violations) {
      logger.out(`  ${line}: ${raw} → ${reason}`);
    }
  }

  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";

  if (result.violationCount > 0) {
    logger.out(`\n✖ ${result.violationCount} props-declaration violation(s)${allowlistSuffix}`);
  } else {
    logger.out(
      `✓ No props intersection an interface could express across ${result.scannedFileCount} file(s)${allowlistSuffix}`,
    );
  }
}
