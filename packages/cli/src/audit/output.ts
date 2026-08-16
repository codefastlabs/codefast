import type { CommentAuditResult, LinkAuditResult, RtlAuditResult } from "#/audit/domain/types";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/core/exit-codes";
import { logger } from "#/core/logger";

/**
 * Exit `1` when any non-allowlisted violation remains.
 *
 * @since 1.0.0-canary.7
 */
export function exitCodeForRtlAuditResult(result: RtlAuditResult): number {
  return result.violationCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

/**
 * Human-readable RTL audit report (matches the former packages/ui script shape).
 *
 * @since 1.0.0-canary.7
 */
export function presentRtlAuditResult(result: RtlAuditResult): void {
  for (const file of result.files) {
    logger.out(`\n${file.relativePath}`);
    for (const { line, raw, suggestion } of file.violations) {
      logger.out(`  ${line}: ${raw} → ${suggestion}`);
    }
  }

  const allowlistSuffix = result.allowlistedCount > 0 ? ` (${result.allowlistedCount} allowlisted)` : "";

  if (result.violationCount > 0) {
    logger.out(`\n✖ ${result.violationCount} RTL violation(s)${allowlistSuffix}`);
  } else {
    logger.out(`✓ No physical-direction classes outside the allowlist${allowlistSuffix}`);
  }
}

/**
 * Machine-readable RTL audit summary for `--json`.
 *
 * @since 1.0.0-canary.7
 */
export function formatRtlAuditJsonOutput(result: RtlAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.violationCount === 0,
    cwd: rootDir,
    result,
  });
}

/**
 * Exit `1` when any non-allowlisted broken link remains.
 *
 * @since 0.5.0
 */
export function exitCodeForLinkAuditResult(result: LinkAuditResult): number {
  return result.breakageCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

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

/**
 * Machine-readable link audit summary for `--json`.
 *
 * @since 0.5.0
 */
export function formatLinkAuditJsonOutput(result: LinkAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.breakageCount === 0,
    cwd: rootDir,
    result,
  });
}

/**
 * Exit `1` when any non-allowlisted divider still breaks the convention.
 *
 * @since 0.6.0
 */
export function exitCodeForCommentAuditResult(result: CommentAuditResult): number {
  return result.breakageCount > 0 ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

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

/**
 * Machine-readable comment-divider summary for `--json`.
 *
 * @since 0.6.0
 */
export function formatCommentAuditJsonOutput(result: CommentAuditResult, rootDir: string): string {
  return JSON.stringify({
    schemaVersion: 1 as const,
    ok: result.breakageCount === 0,
    cwd: rootDir,
    result,
  });
}

function truncate(raw: string): string {
  return raw.length <= 60 ? raw : `${raw.slice(0, 57)}…`;
}
