import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CliContainer } from "#lib/core/infra/cli-container.contract";
import { resolveCliWorkspaceRootStrict } from "#lib/core/presentation/workspace-root-strict.presenter";
import { resolveArrangeCliTargetPath } from "#lib/arrange/presentation/resolve-arrange-cli-target.presenter";
import type { ArrangeTargetWorkspaceAndConfig } from "#lib/arrange/presentation/arrange-prelude.types";

export type { ArrangeTargetWorkspaceAndConfig } from "#lib/arrange/presentation/arrange-prelude.types";

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
  const rootDir = rootOutcome.value;
  cli.appOrchestrator.bindWorkspaceContext({ rootDir });
  const loadedOutcome = await cli.appOrchestrator.tryLoadCodefastConfig(rootDir);
  if (!loadedOutcome.ok) {
    return loadedOutcome;
  }
  return ok({
    resolvedTarget,
    rootDir,
    config: loadedOutcome.value.config,
  });
}
