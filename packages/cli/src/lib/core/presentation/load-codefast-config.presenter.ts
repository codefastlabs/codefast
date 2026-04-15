import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/container.adapter";
import type { CodefastConfig } from "#lib/config/domain/schema.domain";
import { loadConfig } from "#lib/config/infra/loader.adapter";
import { printConfigSchemaWarnings } from "#lib/infra/config-reporter.adapter";

export async function tryLoadCodefastConfig(
  cli: CliContainer,
  rootDir: string,
): Promise<Result<{ config: CodefastConfig }, AppError>> {
  try {
    const { config, warnings } = await loadConfig(cli.fs, rootDir);
    printConfigSchemaWarnings(cli.logger, warnings);
    return ok({ config });
  } catch (caughtError: unknown) {
    return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
  }
}
