import { inject, injectable } from "@codefast/di";
import { loadCodefastConfig } from "#/lib/config/application/services/load-config.service";
import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";
import type { ConfigWarningReporterPort } from "#/lib/config/application/ports/config-warning-reporter.port";
import {
  ConfigLoaderPortToken,
  ConfigWarningReporterPortToken,
} from "#/lib/config/contracts/tokens";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";

// ─── Contract ────────────────────────────────────────────────────────────────

export interface LoadCodefastConfigUseCase {
  execute(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

@injectable([inject(ConfigLoaderPortToken), inject(ConfigWarningReporterPortToken)])
export class LoadCodefastConfigUseCaseImpl implements LoadCodefastConfigUseCase {
  constructor(
    private readonly configLoader: ConfigLoaderPort,
    private readonly warningReporter: ConfigWarningReporterPort,
  ) {}

  async execute(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>> {
    try {
      const loadedConfig = await loadCodefastConfig(this.configLoader, rootDir);
      if (!loadedConfig.ok) {
        return loadedConfig;
      }
      this.warningReporter.reportSchemaWarnings(loadedConfig.value.warnings);
      return ok({ config: loadedConfig.value.config });
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
  }
}
