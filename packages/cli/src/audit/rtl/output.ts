import type { RtlAuditResult } from "#/audit/domain/types";
import { logger } from "#/core/logger";

/**
 * Human-readable RTL audit report (matches the former packages/ui script shape).
 *
 * @since 0.5.0-canary.6
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
