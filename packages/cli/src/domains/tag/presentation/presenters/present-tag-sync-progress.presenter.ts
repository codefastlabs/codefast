import { inject, injectable } from "@codefast/di";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import { CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";
import type {
  TagResolvedTarget,
  TagTargetExecutionResult,
} from "#/domains/tag/domain/types.domain";
import type { PresentTagSyncProgressPresenter as PresentTagSyncProgressPresenterContract } from "#/domains/tag/application/ports/presenting/present-tag-sync-progress.presenter";

type TagProgressEvent =
  | { type: "target-started"; target: TagResolvedTarget }
  | { type: "target-completed"; target: TagResolvedTarget; result: TagTargetExecutionResult };

@injectable([inject(CliLoggerPortToken)])
export class PresentTagSyncProgressPresenter implements PresentTagSyncProgressPresenterContract {
  constructor(private readonly logger: CliLoggerPort) {}

  onTargetStarted(target: TagResolvedTarget): void {
    this.logger.out(this.formatProgress({ type: "target-started", target }));
  }

  onTargetCompleted(target: TagResolvedTarget, result: TagTargetExecutionResult): void {
    this.logger.out(this.formatProgress({ type: "target-completed", target, result }));
  }

  private formatProgress(event: TagProgressEvent): string {
    const targetDisplayName = (target: TagResolvedTarget): string =>
      target.packageName ?? target.rootRelativeTargetPath;

    if (event.type === "target-started") {
      return `[tag] Processing ${targetDisplayName(event.target)}...`;
    }
    const changedFiles = event.result.result?.filesChanged ?? 0;
    return `[tag] Done ${targetDisplayName(event.target)} (${changedFiles} changes)`;
  }
}
