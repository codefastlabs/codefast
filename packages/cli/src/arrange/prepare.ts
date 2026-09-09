import type { ArrangeTargetWorkspaceAndConfig } from "#/arrange/domain/types";
import { resolveArrangeTargetPath } from "#/arrange/resolve-target";
import { loadCodefastConfig } from "#/core/config";
import { AppError } from "#/core/errors";
import { messageFrom } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { resolveProjectRoot } from "#/core/workspace/resolver";

/**
 * Resolves the arrange target, repo root, and loaded config an arrange run needs.
 *
 * @since 0.3.16-canary.0
 */
export async function prepareArrangeWorkspace(
  fs: Filesystem,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>> {
  const resolvedTarget = resolveArrangeTargetPath(fs, {
    currentWorkingDirectory: args.currentWorkingDirectory,
    rawTarget: args.rawTarget,
  });
  if (!fs.existsSync(resolvedTarget)) {
    return err(new AppError("NOT_FOUND", `Not found: ${resolvedTarget}`));
  }
  let rootDir: string;
  try {
    rootDir = resolveProjectRoot(args.currentWorkingDirectory, fs).rootDir;
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
  const loadedOutcome = await loadCodefastConfig(rootDir, fs);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  return ok({ resolvedTarget, rootDir, config: loadedOutcome.value.config });
}
