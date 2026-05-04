import { loadCodefastConfig } from "#/core/config";
import type { FilesystemPort } from "#/core/filesystem";
import type { Result } from "#/core/result";
import { ok } from "#/core/result";
import { findRepoRoot } from "#/core/workspace";
import type { AppError } from "#/core/errors";
import type { TagCommandPrelude } from "#/tag/domain/types.domain";
import { resolveProvidedTagTargetPath } from "#/tag/resolve-target-path";

export async function prepareTagSync(
  fs: FilesystemPort,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<TagCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    rootDir = findRepoRoot(args.currentWorkingDirectory, fs);
  } catch {
    rootDir = args.currentWorkingDirectory;
  }

  const loadedOutcome = await loadCodefastConfig(rootDir, fs);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }

  const resolvedTargetPath = resolveProvidedTagTargetPath(fs, {
    currentWorkingDirectory: args.currentWorkingDirectory,
    rawTarget: args.rawTarget,
  });

  return ok({
    rootDir,
    config: loadedOutcome.value.config,
    resolvedTargetPath,
  });
}
