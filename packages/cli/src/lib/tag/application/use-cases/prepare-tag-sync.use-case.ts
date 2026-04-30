import { inject, injectable } from "@codefast/di";
import type { RepoRootResolverPort } from "#/lib/core/application/ports/repo-root-resolver.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";
import {
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/lib/core/contracts/tokens";
import type { Result } from "#/lib/core/domain/result.model";
import { ok } from "#/lib/core/domain/result.model";
import type { TagCommandPrelude } from "#/lib/tag/contracts/models";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { TagCliTargetPathResolverService } from "#/lib/tag/contracts/services.contract";
import { TagCliTargetPathResolverServiceToken } from "#/lib/tag/contracts/tokens";

export interface PrepareTagSyncUseCase {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<TagCommandPrelude, AppError>>;
}

@injectable([
  inject(TagCliTargetPathResolverServiceToken),
  inject(RepoRootResolverPortToken),
  inject(LoadCodefastConfigUseCaseToken),
])
export class PrepareTagSyncUseCaseImpl implements PrepareTagSyncUseCase {
  constructor(
    private readonly tagCliTargetPathResolver: TagCliTargetPathResolverService,
    private readonly repoRootResolver: RepoRootResolverPort,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
  ) {}

  private resolveTagWorkspaceRootPath(currentWorkingDirectory: string): string {
    try {
      return this.repoRootResolver.findRepoRoot(currentWorkingDirectory);
    } catch {
      return currentWorkingDirectory;
    }
  }

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<TagCommandPrelude, AppError>> {
    const rootDir = this.resolveTagWorkspaceRootPath(args.currentWorkingDirectory);

    const loadedOutcome = await this.loadCodefastConfig.execute(rootDir);
    if (!loadedOutcome.ok) {
      return loadedOutcome;
    }

    const resolvedTargetPath = this.tagCliTargetPathResolver.resolveCliTargetPath({
      currentWorkingDirectory: args.currentWorkingDirectory,
      rawTarget: args.rawTarget,
    });

    return ok({
      rootDir,
      config: loadedOutcome.value.config,
      resolvedTargetPath,
    });
  }
}
