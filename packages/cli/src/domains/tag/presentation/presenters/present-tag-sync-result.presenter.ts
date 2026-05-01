import { inject, injectable } from "@codefast/di";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import { CliLoggerPortToken } from "#/shell/application/cli-runtime.tokens";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-result.presenter";
import type { TagSyncResult } from "#/domains/tag/domain/types.domain";
import { presentTagSyncCliResult } from "#/domains/tag/presentation/presenters/tag-sync.presenter";

@injectable([inject(CliLoggerPortToken)])
export class PresentTagSyncResultPresenterImpl implements PresentTagSyncResultPresenter {
  constructor(private readonly logger: CliLoggerPort) {}

  present(result: TagSyncResult, rootDir: string): number {
    return presentTagSyncCliResult(this.logger, result, rootDir);
  }
}
