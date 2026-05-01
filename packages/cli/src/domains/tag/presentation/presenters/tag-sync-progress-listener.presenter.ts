import { inject, injectable } from "@codefast/di";
import type { CliLogger } from "#/shell/application/ports/outbound/cli-io.port";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";
import type {
  TagProgressListener,
  TagResolvedTarget,
  TagTargetExecutionResult,
} from "#/domains/tag/domain/types.domain";
import { formatProgress } from "#/domains/tag/presentation/presenters/tag-sync.presenter";

@injectable([inject(CliLoggerToken)])
export class TagSyncProgressListener implements TagProgressListener {
  constructor(private readonly logger: CliLogger) {}

  onTargetStarted(target: TagResolvedTarget): void {
    this.logger.out(formatProgress({ type: "target-started", target }));
  }

  onTargetCompleted(target: TagResolvedTarget, result: TagTargetExecutionResult): void {
    this.logger.out(formatProgress({ type: "target-completed", target, result }));
  }
}
