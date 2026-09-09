import { resolveProjectRootResult } from "#/core/cli/resolve-root";
import type { AppError } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import type { Result } from "#/core/result";
import { ok } from "#/core/result";

/**
 * The repo root and package filter a pack-slim run starts from.
 *
 * @since 0.8.1
 */
export interface PackSlimCommandPrelude {
  readonly rootDir: string;
  readonly packageFilter: string | undefined;
}

/**
 * Resolves the repo root and optional package filter into the prelude a pack-slim run starts from.
 *
 * @since 0.8.1
 */
export async function preparePackSlim(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
  },
): Promise<Result<PackSlimCommandPrelude, AppError>> {
  const rootOutcome = resolveProjectRootResult(fs, args.currentWorkingDirectory);
  if (!rootOutcome.ok) {
    return rootOutcome;
  }
  return ok({ rootDir: rootOutcome.value, packageFilter: args.packageArg });
}
