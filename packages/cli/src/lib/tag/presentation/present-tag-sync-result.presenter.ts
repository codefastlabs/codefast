import { inject, injectable } from "@codefast/di";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { CliLoggerToken } from "#/lib/core/operational/contracts/tokens";
import type { PresentTagSyncResultPresenter } from "#/lib/tag/contracts/presentation.contract";
import type { TagSyncResult } from "#/lib/tag/domain/types.domain";
import { presentTagSyncCliResult } from "#/lib/tag/presentation/tag-sync.presenter";

@injectable([inject(CliLoggerToken)])
export class PresentTagSyncResultPresenterImpl implements PresentTagSyncResultPresenter {
  constructor(private readonly logger: CliLogger) {}

  present(result: TagSyncResult, rootDir: string): number {
    return presentTagSyncCliResult(this.logger, result, rootDir);
  }
}
