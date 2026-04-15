import type { CodefastConfig } from "#lib/config/domain/schema.domain";
import type { AppError } from "#lib/core/domain/errors.domain";
import { ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/container.adapter";
import { tryLoadCodefastConfig } from "#lib/core/presentation/load-codefast-config.presenter";
import {
  parseGlobalCliOptions,
  type GlobalCliOptions,
} from "#lib/core/presentation/global-cli-options.presenter";
import { resolveCliWorkspaceRootStrict } from "#lib/core/presentation/workspace-root-strict.presenter";
import { resolveMirrorPackageArgToRelative } from "#lib/mirror/presentation/resolve-mirror-package-arg.presenter";

export type MirrorSyncCommandPrelude = {
  readonly globals: GlobalCliOptions;
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly packageFilter: string | undefined;
};

export async function prepareMirrorSync(
  cli: CliContainer,
  args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globalCliRaw: unknown;
  },
): Promise<Result<MirrorSyncCommandPrelude, AppError>> {
  const globalsOutcome = parseGlobalCliOptions(args.globalCliRaw);
  if (!globalsOutcome.ok) {
    return globalsOutcome;
  }
  const rootOutcome = resolveCliWorkspaceRootStrict(cli);
  if (!rootOutcome.ok) {
    return rootOutcome;
  }
  const rootDir = rootOutcome.value;
  const filterOutcome = resolveMirrorPackageArgToRelative({
    fs: cli.fs,
    rootDir,
    packageArg: args.packageArg,
    currentWorkingDirectory: args.currentWorkingDirectory,
  });
  if (!filterOutcome.ok) {
    return filterOutcome;
  }
  const loadedOutcome = await tryLoadCodefastConfig(cli, rootDir);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  return ok({
    globals: globalsOutcome.value,
    rootDir,
    config: loadedOutcome.value.config,
    packageFilter: filterOutcome.value,
  });
}
