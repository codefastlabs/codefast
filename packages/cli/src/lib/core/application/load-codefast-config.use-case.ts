import { inject, injectable } from "@codefast/di";
import { loadCodefastConfig } from "#/lib/config/application/use-cases/load-config.use-case";
import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";
import { ConfigLoaderPortToken } from "#/lib/config/contracts/tokens";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import { printConfigSchemaWarnings } from "#/lib/infra/config-reporter.adapter";

// ─── Contract ────────────────────────────────────────────────────────────────

export interface LoadCodefastConfigUseCase {
  execute(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

@injectable([inject(CliLoggerToken), inject(ConfigLoaderPortToken)])
export class LoadCodefastConfigUseCaseImpl implements LoadCodefastConfigUseCase {
  constructor(
    private readonly logger: CliLogger,
    private readonly configLoader: ConfigLoaderPort,
  ) {}

  async execute(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>> {
    try {
      const loadedConfig = await loadCodefastConfig(this.configLoader, rootDir);
      if (!loadedConfig.ok) {
        return loadedConfig;
      }
      printConfigSchemaWarnings(this.logger, loadedConfig.value.warnings);
      return ok({ config: loadedConfig.value.config });
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
  }
}
