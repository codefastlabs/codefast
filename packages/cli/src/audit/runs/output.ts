import type { RunsAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

/**
 * Human-readable committed-bench-runs report.
 */
export function presentRunsAuditResult(result: RunsAuditResult): void {
  for (const { relativePath, reason } of result.findings) {
    logger.out(`${relativePath} → ${reason}`);
  }

  if (result.findingCount > 0) {
    logger.out(`\n✖ ${result.findingCount} committed bench run finding(s)`);
  } else {
    logger.out(`✓ Committed bench runs are clean across ${result.scannedSuiteCount} suite(s)`);
  }
}
