import { loadCodefastConfig } from "#/core/config";
import type { AppError } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import type { Result } from "#/core/result";
import { ok } from "#/core/result";
import { resolveProjectRoot } from "#/core/workspace/resolver";
import type { TagCommandPrelude } from "#/tag/domain/types";
import { resolveProvidedTagTargetPath } from "#/tag/resolve-target-path";

/**
 * Resolves the repo root, config, and optional target path into the prelude a tag run starts from.
 *
 * @since 0.3.16-canary.0
 */
export async function prepareTag(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<TagCommandPrelude, AppError>> {
  let rootDir: string;
  try {
    rootDir = resolveProjectRoot(args.currentWorkingDirectory, fs).rootDir;
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
