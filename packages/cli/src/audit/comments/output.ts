import type { CommentAuditResult } from "#/audit/domain/types";
import { logger } from "#/core/logger";

/**
 * Human-readable comment-divider report.
 *
 * @since 0.6.0
 */
export function presentCommentAuditResult(result: CommentAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, reason } of file.breakages) {
      logger.out(`  ${line}: ${truncate(raw)} → ${reason}`);
    }
  }

  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";
  if (result.fixedCount > 0) {
    logger.out(`\n✎ Rewrote ${result.fixedCount} divider(s)`);
  }

  if (result.breakageCount > 0) {
    logger.out(`\n✖ ${result.breakageCount} comment issue(s)${allowlistSuffix} — --fix rewrites divider forms`);
  } else {
    logger.out(
      `✓ ${result.dividerCount} divider(s) across ${result.scannedFileCount} file(s), no banned comment content${allowlistSuffix}`,
    );
  }
}

function truncate(raw: string): string {
  return raw.length <= 60 ? raw : `${raw.slice(0, 57)}…`;
}
