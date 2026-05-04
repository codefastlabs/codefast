import { AppError } from "#/core/errors";
import { messageFrom } from "#/core/errors";
import { loadCodefastConfig } from "#/core/config";
import type { FilesystemPort } from "#/core/filesystem";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { findRepoRoot } from "#/core/workspace";
import type { GlobalCliOptions } from "#/core/global-cli-options";
import type { MirrorSyncCommandPrelude } from "#/mirror/domain/types.domain";
import { resolveMirrorPackageFromCliArg } from "#/mirror/mirror-package-path";

export async function prepareMirrorSync(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globals: GlobalCliOptions;
  },
): Promise<Result<MirrorSyncCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    rootDir = findRepoRoot(args.currentWorkingDirectory, fs);
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
