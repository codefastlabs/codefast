import { inject, injectable } from "@codefast/di";
import type { CliLogger } from "#/shell/application/ports/outbound/cli-io.port";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-result.port";
import type { TagSyncResult } from "#/domains/tag/domain/types.domain";
import { presentTagSyncCliResult } from "#/domains/tag/presentation/presenters/tag-sync.presenter";

@injectable([inject(CliLoggerToken)])
export class PresentTagSyncResultPresenterImpl implements PresentTagSyncResultPresenter {
  constructor(private readonly logger: CliLogger) {}

  present(result: TagSyncResult, rootDir: string): number {
    return presentTagSyncCliResult(this.logger, result, rootDir);
  }
}
