import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { appError, type AppError } from "#/lib/core/domain/errors.domain";
import { err, ok, type Result } from "#/lib/core/domain/result.model";
import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";

export type LoadCodefastConfigResult = {
  config: CodefastConfig;
  warnings: string[];
};

export async function loadCodefastConfig(
  configLoader: ConfigLoaderPort,
  fs: CliFs,
  rootDir: string,
): Promise<Result<LoadCodefastConfigResult, AppError>> {
  try {
    const { config, warnings } = await configLoader.loadConfig(fs, rootDir);
    return ok({ config, warnings });
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}
