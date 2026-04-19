import { inject, injectable } from "@codefast/di";
import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";
import { ConfigLoaderPortToken } from "#/lib/config/contracts/tokens";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { TryLoadCodefastConfigPresenter } from "#/lib/core/contracts/presentation.contract";
import { CliFsToken, CliLoggerToken } from "#/lib/core/operational/contracts/tokens";
import { tryLoadCodefastConfig } from "#/lib/core/presentation/load-codefast-config.presenter";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";

@injectable([inject(CliFsToken), inject(CliLoggerToken), inject(ConfigLoaderPortToken)])
export class TryLoadCodefastConfigPresenterImpl implements TryLoadCodefastConfigPresenter {
  constructor(
    private readonly fs: CliFs,
    private readonly logger: CliLogger,
    private readonly configLoader: ConfigLoaderPort,
  ) {}

  execute(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>> {
    return tryLoadCodefastConfig({ fs: this.fs, logger: this.logger }, this.configLoader, rootDir);
  }
}
