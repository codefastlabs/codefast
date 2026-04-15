import type { AppError } from "#lib/core/domain/errors.domain";
import { ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/cli-container.contract";
import { parseGlobalCliOptions } from "#lib/core/presentation/global-cli-options.presenter";
import { resolveCliWorkspaceRootStrict } from "#lib/core/presentation/workspace-root-strict.presenter";
import { resolveMirrorPackageArgToRelative } from "#lib/mirror/presentation/resolve-mirror-package-arg.presenter";
import type { MirrorSyncCommandPrelude } from "#lib/mirror/presentation/mirror-prelude.types";

export type { MirrorSyncCommandPrelude } from "#lib/mirror/presentation/mirror-prelude.types";

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
  cli.appOrchestrator.bindWorkspaceContext({ rootDir, globalCliRaw: args.globalCliRaw });
  const loadedOutcome = await cli.appOrchestrator.tryLoadCodefastConfig(rootDir);
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
