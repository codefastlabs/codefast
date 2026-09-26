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

  for (const { packageName, stylesheet, sources, missingFilesEntries } of result.unreachableStylesheets) {
    logger.out(`\n${packageName}: ${stylesheet} registers no file the tarball ships`);
    for (const { line, pattern } of sources) {
      logger.out(`  ${line}: @source "${pattern}"`);
    }
    if (missingFilesEntries.length > 0) {
      logger.out(`  not on disk: ${missingFilesEntries.join(", ")} — build the package first`);
    }
  }

  const problems = result.legacyImportCount + result.unshipped.length + result.unreachableStylesheets.length;
  if (problems > 0) {
    logger.out(
      `\n✖ ${result.legacyImportCount} legacy "#/" import(s), ${result.unshipped.length} unshipped target(s), ${result.unreachableStylesheets.length} stylesheet(s) registering nothing shipped`,
    );
  } else {
    logger.out(
      `✓ No "#/" imports across ${result.scannedFileCount} file(s); every publish target and stylesheet source ships across ${result.packageCount} package(s)`,
    );
  }
}
