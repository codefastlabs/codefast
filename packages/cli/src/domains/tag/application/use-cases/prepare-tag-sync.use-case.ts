import { inject, injectable } from "@codefast/di";
import type { RepoRootResolverPort } from "#/shell/application/outbound/repo-root-resolver.outbound-port";
import type { LoadCodefastConfigUseCase } from "#/shell/application/inbound/load-codefast-config.use-case";
import {
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/shell/application/cli-runtime.tokens";
import type { Result } from "#/shell/domain/result.model";
import { ok } from "#/shell/domain/result.model";
import type { TagCommandPrelude } from "#/domains/tag/contracts/models";
import type { AppError } from "#/shell/domain/errors.domain";
import type { TagCliTargetPathResolverService } from "#/domains/tag/contracts/services.contract";
import { TagCliTargetPathResolverServiceToken } from "#/domains/tag/contracts/tokens";
import type { PrepareTagSyncUseCase } from "#/domains/tag/application/inbound/prepare-tag-sync.use-case";

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
