import { inject, injectable } from "@codefast/di";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import type { RepoRootResolverPort } from "#/lib/core/application/ports/repo-root-resolver.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";
import {
  CliFsToken,
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/lib/core/contracts/tokens";
import { ok } from "#/lib/core/domain/result.model";
import type { TagCommandPrelude } from "#/lib/tag/contracts/models";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { resolveTagCliTargetPath } from "#/lib/tag/application/services/tag-cli-target-path-resolver.service";

export interface PrepareTagSyncUseCase {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<TagCommandPrelude, AppError>>;
}

function resolveTagWorkspaceRootPath(args: {
  readonly repoRootResolver: RepoRootResolverPort;
  readonly currentWorkingDirectory: string;
}): string {
  try {
    return args.repoRootResolver.findRepoRoot(args.currentWorkingDirectory);
  } catch {
    return args.currentWorkingDirectory;
  }
}

@injectable([
  inject(CliFsToken),
  inject(RepoRootResolverPortToken),
  inject(LoadCodefastConfigUseCaseToken),
])
export class PrepareTagSyncUseCaseImpl implements PrepareTagSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly repoRootResolver: RepoRootResolverPort,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<TagCommandPrelude, AppError>> {
    const rootDir = resolveTagWorkspaceRootPath({
      repoRootResolver: this.repoRootResolver,
      currentWorkingDirectory: args.currentWorkingDirectory,
    });

    const loadedOutcome = await this.loadCodefastConfig.execute(rootDir);
    if (!loadedOutcome.ok) {
      return loadedOutcome;
    }

    const resolvedTargetPath = resolveTagCliTargetPath({
      fs: this.fs,
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
