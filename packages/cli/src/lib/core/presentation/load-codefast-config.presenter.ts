import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";
import { loadCodefastConfig } from "#/lib/config/application/use-cases/load-config.use-case";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { AppError } from "#/lib/core/domain/errors.domain";
import { appError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import { printConfigSchemaWarnings } from "#/lib/infra/config-reporter.adapter";

/**
 * Minimal CLI slice required to load config (avoids depending on the full CLI composition-root type).
 */
export type TryLoadCodefastConfigCliSlice = {
  readonly fs: CliFs;
  readonly logger: CliLogger;
};

export async function tryLoadCodefastConfig(
  cli: TryLoadCodefastConfigCliSlice,
  configLoader: ConfigLoaderPort,
  rootDir: string,
): Promise<Result<{ config: CodefastConfig }, AppError>> {
  try {
    const loadedConfig = await loadCodefastConfig(configLoader, cli.fs, rootDir);
    if (!loadedConfig.ok) {
      return loadedConfig;
    }
    printConfigSchemaWarnings(cli.logger, loadedConfig.value.warnings);
    return ok({ config: loadedConfig.value.config });
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}
