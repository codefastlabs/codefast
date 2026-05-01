import { inject, injectable } from "@codefast/di";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import { CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";
import type {
  TagProgressListener,
  TagResolvedTarget,
  TagTargetExecutionResult,
} from "#/domains/tag/domain/types.domain";
import { formatProgress } from "#/domains/tag/presentation/presenters/tag-sync.presenter";

@injectable([inject(CliLoggerPortToken)])
export class TagSyncProgressListener implements TagProgressListener {
  constructor(private readonly logger: CliLoggerPort) {}

  onTargetStarted(target: TagResolvedTarget): void {
    this.logger.out(formatProgress({ type: "target-started", target }));
  }

  onTargetCompleted(target: TagResolvedTarget, result: TagTargetExecutionResult): void {
    this.logger.out(formatProgress({ type: "target-completed", target, result }));
  }
}
