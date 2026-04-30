import { inject, injectable } from "@codefast/di";
import { loadCodefastConfig } from "#/domains/config/application/services/load-config.service";
import type { ConfigLoaderPort } from "#/domains/config/application/ports/config-loader.port";
import type { ConfigWarningReporterPort } from "#/domains/config/application/ports/config-warning-reporter.port";
import {
  ConfigLoaderPortToken,
  ConfigWarningReporterPortToken,
} from "#/domains/config/contracts/tokens";
import type { CodefastConfig } from "#/domains/config/domain/schema.domain";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";

export interface LoadCodefastConfigUseCase {
  execute(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>>;
}

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
