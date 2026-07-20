import type { RtlAuditResult } from "#/audit/domain/types";
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
