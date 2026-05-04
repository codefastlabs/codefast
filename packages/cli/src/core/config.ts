import { loadConfigPayload } from "#/core/config/loader";
import { reportSchemaWarnings } from "#/core/config/warnings";
import type { CodefastConfig } from "#/core/config/schema";
import { AppError, messageFrom } from "#/core/errors";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";

/**
 * @since 0.3.16-canary.0
 */
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
