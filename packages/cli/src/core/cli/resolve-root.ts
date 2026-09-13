import { AppError, messageFrom } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { resolveProjectRoot } from "#/core/workspace/resolver";

/**
 * Resolves the project root as a `Result`, mapping a resolution failure to an `INFRA_FAILURE` error.
 *
 * @since 0.11.0
 */
export function resolveProjectRootResult(fs: Filesystem, currentWorkingDirectory: string): Result<string, AppError> {
  try {
    return ok(resolveProjectRoot(currentWorkingDirectory, fs).rootDir);
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
}
