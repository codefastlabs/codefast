import type { CliLogger } from "#/shell/application/outbound/cli-io.outbound-port";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/shell/domain/cli-exit-codes.domain";
import type { ArrangeRunResult } from "#/domains/arrange/domain/types.domain";

export function exitCodeForArrangeSyncResult(result: ArrangeRunResult): number {
  return result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

export function presentArrangeSyncResult(
  logger: CliLogger,
  result: ArrangeRunResult,
  write: boolean,
): number {
  logger.out(
    `\nTotal: ${result.filePaths.length} file(s), ${result.totalFound} site(s) (cn/tv/JSX className) to review.`,
  );
  if (write) {
    logger.out(`Applied: ${result.totalChanged} site(s) updated.`);
  } else {
    logger.out(
      `(Run "apply" to write changes, or "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
    );
  }
  const shouldShowCascadeHint = write ? result.totalChanged > 0 : result.totalFound > 0;
  if (shouldShowCascadeHint) {
    logger.out(
      "Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.",
    );
  }
  if (result.hookError !== null) {
    logger.err(result.hookError);
  }
  return exitCodeForArrangeSyncResult(result);
}
