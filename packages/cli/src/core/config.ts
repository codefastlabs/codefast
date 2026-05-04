import { loadConfigPayload } from "#/config/loader";
import { reportSchemaWarnings } from "#/config/warnings";
import type { CodefastConfig } from "#/config/schema";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";

export async function loadCodefastConfig(
  rootDir: string,
  fs: FilesystemPort,
): Promise<Result<{ config: CodefastConfig }, AppError>> {
  try {
    const { config, warnings } = await loadConfigPayload(rootDir, fs);
    reportSchemaWarnings(warnings);
    return ok({ config });
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
