import type { PublishAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

/**
 * Human-readable publish audit report.
 *
 * @since 0.12.0
 */
export function presentPublishAuditResult(result: PublishAuditResult): void {
  for (const file of result.legacyImportFiles) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw } of file.imports) {
      logger.out(`  ${line}: ${raw} → use a bare "#" prefix, not "#/"`);
    }
  }

  for (const { packageName, field, subpath, target } of result.unshipped) {
    logger.out(`\n${packageName}: ${field}["${subpath}"] → ${target} is not shipped by "files"`);
  }

  const problems = result.legacyImportCount + result.unshipped.length;
  if (problems > 0) {
    logger.out(`\n✖ ${result.legacyImportCount} legacy "#/" import(s), ${result.unshipped.length} unshipped target(s)`);
  } else {
    logger.out(
      `✓ No "#/" imports across ${result.scannedFileCount} file(s); every publish target ships across ${result.packageCount} package(s)`,
    );
  }
}
