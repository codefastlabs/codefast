import type { LinkAuditResult } from "#/audit/domain/types";
import { logger } from "#/core/logger";

/**
 * Human-readable link audit report.
 *
 * @since 0.5.0
 */
export function presentLinkAuditResult(result: LinkAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, reason } of file.breakages) {
      logger.out(`  ${line}: ${raw} → ${reason}`);
    }
  }

  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";

  if (result.breakageCount > 0) {
    logger.out(`\n✖ ${result.breakageCount} broken link(s)${allowlistSuffix}`);
  } else {
    logger.out(
      `✓ ${result.linkCount} repo-local link(s) across ${result.scannedFileCount} document(s) all resolve${allowlistSuffix}`,
    );
  }
}
