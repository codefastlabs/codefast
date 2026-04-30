import { inject, injectable } from "@codefast/di";
import type { GlobalCliOptions } from "#/lib/core/application/services/global-cli-options-parser.service";
import type { RepoRootResolverPort } from "#/lib/core/application/ports/repo-root-resolver.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";
import {
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/lib/core/contracts/tokens";
import type { MirrorSyncCommandPrelude } from "#/lib/mirror/contracts/models";
import type { MirrorPackageArgResolverPort } from "#/lib/mirror/application/ports/mirror-package-arg-resolver.port";
import { MirrorPackageArgResolverPortToken } from "#/lib/mirror/contracts/tokens";
import { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import { messageFromCaughtUnknown } from "#/lib/core/domain/caught-unknown-message.value-object";

export interface PrepareMirrorSyncUseCase {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globals: GlobalCliOptions;
  }): Promise<Result<MirrorSyncCommandPrelude, AppError>>;
}

@injectable([
  inject(MirrorPackageArgResolverPortToken),
  inject(RepoRootResolverPortToken),
  inject(LoadCodefastConfigUseCaseToken),
])
export class PrepareMirrorSyncUseCaseImpl implements PrepareMirrorSyncUseCase {
  constructor(
    private readonly mirrorPackageArgResolver: MirrorPackageArgResolverPort,
    private readonly repoRootResolver: RepoRootResolverPort,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globals: GlobalCliOptions;
  }): Promise<Result<MirrorSyncCommandPrelude, AppError>> {
    let rootDir: string;
    try {
      rootDir = this.repoRootResolver.findRepoRoot(args.currentWorkingDirectory);
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }

    const filterOutcome = this.mirrorPackageArgResolver.resolveFromCliArg({
      rootDir,
      packageArg: args.packageArg,
      currentWorkingDirectory: args.currentWorkingDirectory,
    });
    if (!filterOutcome.ok) {
      return filterOutcome;
    }

    const loadedOutcome = await this.loadCodefastConfig.execute(rootDir);
    if (!loadedOutcome.ok) {
      return loadedOutcome;
    }

    return ok({
      globals: args.globals,
      rootDir,
      config: loadedOutcome.value.config,
      packageFilter: filterOutcome.value,
    });
  }
}
