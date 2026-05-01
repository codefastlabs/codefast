import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import type { ConfigLoaderPort } from "#/domains/config/application/ports/outbound/config-loader.port";
import type { CodefastConfig } from "#/domains/config/domain/schema.domain";

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
