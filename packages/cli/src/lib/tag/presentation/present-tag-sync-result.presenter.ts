import { inject, injectable } from "@codefast/di";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { TagSyncResult } from "#/lib/tag/domain/types.domain";
import type { PresentTagSyncResultPresenter } from "#/lib/tokens";
import { CliLoggerToken } from "#/lib/tokens";
import { presentTagSyncCliResult } from "#/lib/tag/presentation/tag-sync.presenter";

@injectable([inject(CliLoggerToken)])
export class PresentTagSyncResultPresenterImpl implements PresentTagSyncResultPresenter {
  constructor(private readonly logger: CliLogger) {}

  present(result: TagSyncResult, rootDir: string): number {
    return presentTagSyncCliResult(this.logger, result, rootDir);
  }
}
