import type { ArrangeRunResult } from "#/arrange/domain/types";
import { logger } from "#/core/logger";

/**
 * Prints the totals for an `arrange simplify` run.
 *
 * @since 0.3.16-canary.0
 */
export function printSimplifyResult(result: ArrangeRunResult, write: boolean): void {
  logger.out(`\nTotal: ${result.filePaths.length} file(s), ${result.totalFound} site(s) to simplify.`);
  if (write) {
    logger.out(`Applied: ${result.totalChanged} site(s) updated.`);
  } else {
    logger.out(
      `(Run "simplify" to write changes, or "pnpm cli:arrange-simplify" / "pnpm exec codefast arrange simplify")`,
    );
  }
}
