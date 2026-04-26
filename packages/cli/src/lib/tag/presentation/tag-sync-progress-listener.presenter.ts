import { inject, injectable } from "@codefast/di";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import type {
  TagProgressListener,
  TagResolvedTarget,
  TagTargetExecutionResult,
} from "#/lib/tag/domain/types.domain";
import { formatProgress } from "#/lib/tag/presentation/tag-sync.presenter";

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
