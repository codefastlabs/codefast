import { AppError } from "#/core/errors";
import { messageFrom } from "#/core/errors";
import { loadCodefastConfig } from "#/core/config";
import type { FilesystemPort } from "#/core/filesystem/port";
import type { Result } from "#/core/result";
import { err, ok } from "#/core/result";
import { findRepoRoot } from "#/core/workspace/resolver";
import type { ArrangeTargetWorkspaceAndConfig } from "#/arrange/domain/types";
import { resolveArrangeTargetPath } from "#/arrange/resolve-target";

export async function prepareArrangeWorkspace(
  fs: FilesystemPort,
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
    rootDir = findRepoRoot(args.currentWorkingDirectory, fs);
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", messageFrom(caughtError), caughtError));
  }
  const loadedOutcome = await loadCodefastConfig(rootDir, fs);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  return ok({ resolvedTarget, rootDir, config: loadedOutcome.value.config });
}
