import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/container.adapter";
import type { CodefastConfig } from "#lib/config/domain/schema.domain";
import { loadCodefastConfig } from "#lib/config/application/use-cases/load-config.use-case";
import { configLoaderAdapter } from "#lib/config/infra/loader.adapter";
import { printConfigSchemaWarnings } from "#lib/infra/config-reporter.adapter";

export async function tryLoadCodefastConfig(
  cli: CliContainer,
  rootDir: string,
): Promise<Result<{ config: CodefastConfig }, AppError>> {
  try {
    const loadedConfig = await loadCodefastConfig(configLoaderAdapter, cli.fs, rootDir);
    if (!loadedConfig.ok) {
      return loadedConfig;
    }
    printConfigSchemaWarnings(cli.logger, loadedConfig.value.warnings);
    return ok({ config: loadedConfig.value.config });
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}
