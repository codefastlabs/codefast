import { inject, injectable } from "@codefast/di";
import type { GlobalCliOptions } from "#/shell/application/global-cli-options.model";
import type { RepoRootResolverPort } from "#/shell/application/ports/outbound/repo-root-resolver.port";
import type { LoadCodefastConfigPort } from "#/shell/application/ports/inbound/load-codefast-config.port";
import {
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/shell/application/cli-runtime.tokens";
import type { MirrorSyncCommandPrelude } from "#/domains/mirror/contracts/models";
import type { MirrorPackagePathPort } from "#/domains/mirror/application/ports/outbound/mirror-package-path.port";
import { MirrorPackagePathPortToken } from "#/domains/mirror/composition/tokens";
import { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { err, ok } from "#/shell/domain/result.model";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { PrepareMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/prepare-mirror-sync.port";

@injectable([
  inject(MirrorPackagePathPortToken),
  inject(RepoRootResolverPortToken),
  inject(LoadCodefastConfigUseCaseToken),
])
export class PrepareMirrorSyncUseCase implements PrepareMirrorSyncPort {
  constructor(
    private readonly mirrorPackagePath: MirrorPackagePathPort,
    private readonly repoRootResolver: RepoRootResolverPort,
    private readonly loadCodefastConfig: LoadCodefastConfigPort,
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

    const filterOutcome = this.mirrorPackagePath.resolveFromCliArg({
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
