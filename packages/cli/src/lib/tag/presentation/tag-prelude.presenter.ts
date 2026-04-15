import type { AppError } from "#lib/core/domain/errors.domain";
import { ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/cli-container.contract";
import { parseGlobalCliOptions } from "#lib/core/presentation/global-cli-options.presenter";
import { findRepoRoot } from "#lib/infra/workspace/repo-root.adapter";
import { resolveTagCliTargetPath } from "#lib/tag/presentation/resolve-tag-cli-target.presenter";
import { resolveTagWorkspaceRootPath } from "#lib/tag/presentation/resolve-tag-workspace-root.presenter";
import type { TagCommandPrelude } from "#lib/tag/presentation/tag-prelude.types";

export type { TagCommandPrelude } from "#lib/tag/presentation/tag-prelude.types";

export async function prepareTagSync(
  cli: CliContainer,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
    readonly globalCliRaw: unknown;
  },
): Promise<Result<TagCommandPrelude, AppError>> {
  const globalsOutcome = parseGlobalCliOptions(args.globalCliRaw);
  if (!globalsOutcome.ok) {
    return globalsOutcome;
  }
  const rootDir = resolveTagWorkspaceRootPath({
    resolveStrictRepoRoot: () => findRepoRoot(cli.fs),
    logger: cli.logger,
    currentWorkingDirectory: args.currentWorkingDirectory,
  });
  cli.appOrchestrator.bindWorkspaceContext({ rootDir, globalCliRaw: args.globalCliRaw });
  const loadedOutcome = await cli.appOrchestrator.tryLoadCodefastConfig(rootDir);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  const resolvedTargetPath = resolveTagCliTargetPath({
    fs: cli.fs,
    currentWorkingDirectory: args.currentWorkingDirectory,
    rawTarget: args.rawTarget,
  });
  return ok({
    rootDir,
    config: loadedOutcome.value.config,
    resolvedTargetPath,
  });
}
