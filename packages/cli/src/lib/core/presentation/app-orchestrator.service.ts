import { inject, injectable } from "@codefast/di";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import type { AppOrchestrator, TryLoadCodefastConfigPresenter } from "#/lib/tokens";
import { TryLoadCodefastConfigPresenterToken } from "#/lib/tokens";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";

@injectable([inject(TryLoadCodefastConfigPresenterToken)])
export class AppOrchestratorImpl implements AppOrchestrator {
  constructor(private readonly tryLoadConfig: TryLoadCodefastConfigPresenter) {}

  tryLoadCodefastConfig(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>> {
    return this.tryLoadConfig.execute(rootDir);
  }
}
