import { inject, injectable } from "@codefast/di";
import type { RepoRootResolverPort } from "#/shell/application/ports/outbound/repo-root-resolver.port";
import type { LoadCodefastConfigPort } from "#/shell/application/ports/inbound/load-codefast-config.port";
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
import type { PrepareTagSyncPort } from "#/domains/tag/application/ports/inbound/prepare-tag-sync.port";

@injectable([
  inject(TagTargetPathResolverPortToken),
  inject(RepoRootResolverPortToken),
  inject(LoadCodefastConfigUseCaseToken),
])
export class PrepareTagSyncUseCase implements PrepareTagSyncPort {
  constructor(
    private readonly tagInvocationTargetResolver: TagTargetPathResolverPort,
    private readonly repoRootResolver: RepoRootResolverPort,
    private readonly loadCodefastConfig: LoadCodefastConfigPort,
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
