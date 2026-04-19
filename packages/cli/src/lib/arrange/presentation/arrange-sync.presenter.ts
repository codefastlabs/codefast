import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { exitCodeForArrangeSyncResult } from "#/lib/arrange/application/arrange-sync-cli-result";
import type { ArrangeRunResult } from "#/lib/arrange/domain/types.domain";

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
