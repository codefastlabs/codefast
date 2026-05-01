import { inject, injectable } from "@codefast/di";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { PresentArrangeSyncResultPresenter } from "#/domains/arrange/application/ports/presenting/present-arrange-sync-result.presenter";
import { CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#/shell/domain/cli-exit-codes.domain";
import type { ArrangeRunResult } from "#/domains/arrange/domain/types.domain";

export function exitCodeForArrangeSyncResult(result: ArrangeRunResult): number {
  return result.hookError !== null ? CLI_EXIT_GENERAL_ERROR : CLI_EXIT_SUCCESS;
}

@injectable([inject(CliLoggerPortToken)])
export class PresentArrangeSyncResultPresenterImpl implements PresentArrangeSyncResultPresenter {
  constructor(private readonly logger: CliLoggerPort) {}

  present(result: ArrangeRunResult, write: boolean): void {
    this.logger.out(
      `\nTotal: ${result.filePaths.length} file(s), ${result.totalFound} site(s) (cn/tv/JSX className) to review.`,
    );
    if (write) {
      this.logger.out(`Applied: ${result.totalChanged} site(s) updated.`);
    } else {
      this.logger.out(
        `(Run "apply" to write changes, or "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
      );
    }
    const shouldShowCascadeHint = write ? result.totalChanged > 0 : result.totalFound > 0;
    if (shouldShowCascadeHint) {
      this.logger.out(
        "Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.",
      );
    }
    if (result.hookError !== null) {
      this.logger.err(result.hookError);
    }
  }
}
