import { inject, injectable } from "@codefast/di";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { ArrangeTargetPathResolverPort } from "#/domains/arrange/application/ports/arrange-target-path-resolver.port";
import { ArrangeTargetPathResolverPortToken } from "#/domains/arrange/contracts/tokens";
import type { RepoRootResolverPort } from "#/shell/application/ports/repo-root-resolver.port";
import type { ArrangeTargetWorkspaceAndConfig } from "#/domains/arrange/contracts/models";
import type { CliFs } from "#/shell/application/ports/cli-io.port";
import type { LoadCodefastConfigUseCase } from "#/shell/application/load-codefast-config.use-case";
import {
  CliFsToken,
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/shell/application/cli-runtime.tokens";

export interface PrepareArrangeWorkspaceUseCase {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>>;
}

@injectable([
  inject(ArrangeTargetPathResolverPortToken),
  inject(CliFsToken),
  inject(LoadCodefastConfigUseCaseToken),
  inject(RepoRootResolverPortToken),
])
export class PrepareArrangeWorkspaceUseCaseImpl implements PrepareArrangeWorkspaceUseCase {
  constructor(
    private readonly arrangeTargetPathResolver: ArrangeTargetPathResolverPort,
    private readonly fs: CliFs,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
    private readonly repoRootResolver: RepoRootResolverPort,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>> {
    const resolvedTarget = this.arrangeTargetPathResolver.resolveTargetPath({
      currentWorkingDirectory: args.currentWorkingDirectory,
      rawTarget: args.rawTarget,
    });
    if (!this.fs.existsSync(resolvedTarget)) {
      return err(new AppError("NOT_FOUND", `Not found: ${resolvedTarget}`));
    }
    let rootDir: string;
    try {
      rootDir = this.repoRootResolver.findRepoRoot(args.currentWorkingDirectory);
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
