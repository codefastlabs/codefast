import type { CodefastConfig } from "#lib/config/domain/schema.domain";
import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/container.adapter";
import { tryLoadCodefastConfig } from "#lib/core/presentation/load-codefast-config.presenter";
import { resolveCliWorkspaceRootStrict } from "#lib/core/presentation/workspace-root-strict.presenter";
import { resolveArrangeCliTargetPath } from "#lib/arrange/presentation/resolve-arrange-cli-target.presenter";

export type ArrangeTargetWorkspaceAndConfig = {
  readonly resolvedTarget: string;
  readonly rootDir: string;
  readonly config: CodefastConfig;
};

export async function prepareArrangeTargetWorkspaceAndConfig(
  cli: CliContainer,
  args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  },
): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>> {
  const resolvedTarget = resolveArrangeCliTargetPath({
    fs: cli.fs,
    currentWorkingDirectory: args.currentWorkingDirectory,
    rawTarget: args.rawTarget,
  });
  if (!cli.fs.existsSync(resolvedTarget)) {
    return err(appError("NOT_FOUND", `Not found: ${resolvedTarget}`));
  }
  const rootOutcome = resolveCliWorkspaceRootStrict(cli);
  if (!rootOutcome.ok) {
    return rootOutcome;
  }
  const loadedOutcome = await tryLoadCodefastConfig(cli, rootOutcome.value);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  return ok({
    resolvedTarget,
    rootDir: rootOutcome.value,
    config: loadedOutcome.value.config,
  });
}
