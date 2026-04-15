import type { CodefastConfig } from "#lib/config/domain/schema.domain";
import type { AppError } from "#lib/core/domain/errors.domain";
import { ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/container.adapter";
import { tryLoadCodefastConfig } from "#lib/core/presentation/load-codefast-config.presenter";
import { parseGlobalCliOptions } from "#lib/core/presentation/global-cli-options.presenter";
import { findRepoRoot } from "#lib/infra/workspace/repo-root.adapter";
import { resolveTagCliTargetPath } from "#lib/tag/presentation/resolve-tag-cli-target.presenter";
import { resolveTagWorkspaceRootPath } from "#lib/tag/presentation/resolve-tag-workspace-root.presenter";

export type TagCommandPrelude = {
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly resolvedTargetPath: string | undefined;
};

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
  const loadedOutcome = await tryLoadCodefastConfig(cli, rootDir);
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
