import type { GlobalCliOptions } from "#/core/cli/global-options";
import { loadCodefastConfig } from "#/core/config";
import { AppError } from "#/core/errors";
import { messageFrom } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { resolveProjectRoot } from "#/core/workspace/resolver";
import type { MirrorSyncCommandPrelude } from "#/mirror/domain/types";
import { resolveMirrorPackageFromCliArg } from "#/mirror/package-path";

/**
 * Resolves the repo root, config, and package filter into the prelude a mirror run starts from.
 *
 * @since 0.3.16-canary.0
 */
export async function prepareMirrorSync(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globals: GlobalCliOptions;
  },
): Promise<Result<MirrorSyncCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    rootDir = resolveProjectRoot(args.currentWorkingDirectory, fs).rootDir;
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }

  const filterOutcome = resolveMirrorPackageFromCliArg(fs, {
    rootDir,
    packageArg: args.packageArg,
    currentWorkingDirectory: args.currentWorkingDirectory,
  });
  if (!filterOutcome.ok) {
    return filterOutcome;
  }

  const loadedOutcome = await loadCodefastConfig(rootDir, fs);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }

  return ok({
    globals: args.globals,
    rootDir,
    config: loadedOutcome.value.config,
    packageFilter: filterOutcome.value,
  });
}
