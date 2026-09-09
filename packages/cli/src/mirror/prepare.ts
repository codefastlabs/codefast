import type { GlobalCliOptions } from "#/core/cli/global-options";
import { resolveProjectRootResult } from "#/core/cli/resolve-root";
import { loadCodefastConfig } from "#/core/config";
import type { AppError } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import type { Result } from "#/core/result";
import { ok } from "#/core/result";
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
  const rootOutcome = resolveProjectRootResult(fs, args.currentWorkingDirectory);
  if (!rootOutcome.ok) {
    return rootOutcome;
  }
  const rootDir = rootOutcome.value;

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
