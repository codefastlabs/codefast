import { messageFromCaughtUnknown } from "#/lib/core/domain/caught-unknown-message.value-object";
import { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";

type LoadCodefastConfigResult = {
  config: CodefastConfig;
  warnings: string[];
};

export async function loadCodefastConfig(
  configLoader: ConfigLoaderPort,
  rootDir: string,
): Promise<Result<LoadCodefastConfigResult, AppError>> {
  try {
    const { config, warnings } = await configLoader.loadConfig(rootDir);
    return ok({ config, warnings });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}
