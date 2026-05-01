import { inject, injectable } from "@codefast/di";
import type { RepoRootResolverPort } from "#/shell/application/ports/outbound/repo-root-resolver.port";
import type { LoadCodefastConfigUseCase } from "#/shell/application/ports/inbound/load-codefast-config.use-case";
import {
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/shell/application/cli-runtime.tokens";
import type { Result } from "#/shell/domain/result.model";
import { ok } from "#/shell/domain/result.model";
import type { TagCommandPrelude } from "#/domains/tag/contracts/models";
import type { AppError } from "#/shell/domain/errors.domain";
import type { TagTargetPathResolverPort } from "#/domains/tag/application/ports/outbound/tag-target-path-resolver.port";
import { TagTargetPathResolverPortToken } from "#/domains/tag/composition/tokens";
import type { PrepareTagSyncUseCase } from "#/domains/tag/application/ports/inbound/prepare-tag-sync.use-case";

@injectable([
  inject(TagTargetPathResolverPortToken),
  inject(RepoRootResolverPortToken),
  inject(LoadCodefastConfigUseCaseToken),
])
export class PrepareTagSyncUseCaseImpl implements PrepareTagSyncUseCase {
  constructor(
    private readonly tagInvocationTargetResolver: TagTargetPathResolverPort,
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

    const resolvedTargetPath = this.tagInvocationTargetResolver.resolveProvidedTargetPath({
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
