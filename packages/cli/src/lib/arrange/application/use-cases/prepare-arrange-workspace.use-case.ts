import { inject, injectable } from "@codefast/di";
import { AppError } from "#/lib/core/domain/errors.domain";
import { err, ok } from "#/lib/core/domain/result.model";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { resolveArrangeTargetPath } from "#/lib/arrange/application/services/arrange-target-path-resolver.service";
import type { WorkspaceResolverPort } from "#/lib/arrange/application/ports/workspace-resolver.port";
import { WorkspaceResolverPortToken } from "#/lib/arrange/contracts/tokens";
import type { ArrangeTargetWorkspaceAndConfig } from "#/lib/arrange/contracts/models";
import type { Result } from "#/lib/core/domain/result.model";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";
import { CliFsToken, LoadCodefastConfigUseCaseToken } from "#/lib/core/contracts/tokens";

export interface PrepareArrangeWorkspaceUseCase {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>>;
}

// ─── Implementation ──────────────────────────────────────────────────────────

@injectable([
  inject(CliFsToken),
  inject(LoadCodefastConfigUseCaseToken),
  inject(WorkspaceResolverPortToken),
])
export class PrepareArrangeWorkspaceUseCaseImpl implements PrepareArrangeWorkspaceUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
    private readonly workspaceResolver: WorkspaceResolverPort,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>> {
    const resolvedTarget = resolveArrangeTargetPath({
      fs: this.fs,
      currentWorkingDirectory: args.currentWorkingDirectory,
      rawTarget: args.rawTarget,
    });
    if (!this.fs.existsSync(resolvedTarget)) {
      return err(new AppError("NOT_FOUND", `Not found: ${resolvedTarget}`));
    }
    let rootDir: string;
    try {
      rootDir = this.workspaceResolver.findRepoRoot(args.currentWorkingDirectory);
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
    const loadedOutcome = await this.loadCodefastConfig.execute(rootDir);
    if (!loadedOutcome.ok) {
      return loadedOutcome;
    }
    return ok({ resolvedTarget, rootDir, config: loadedOutcome.value.config });
  }
}
