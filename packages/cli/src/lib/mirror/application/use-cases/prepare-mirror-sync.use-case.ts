import { inject, injectable } from "@codefast/di";
import { parseGlobalCliOptions } from "#/lib/core/application/parse-global-cli-options.util";
import type { RepoRootResolverPort } from "#/lib/core/application/ports/repo-root-resolver.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";
import {
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/lib/core/contracts/tokens";
import type { MirrorSyncCommandPrelude } from "#/lib/mirror/contracts/models";
import { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { resolveMirrorPackageArgToRelative } from "#/lib/mirror/application/resolve-mirror-package-arg.util";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { CliFsToken } from "#/lib/core/contracts/tokens";

export interface PrepareMirrorSyncUseCase {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globalCliRaw: unknown;
  }): Promise<Result<MirrorSyncCommandPrelude, AppError>>;
}

@injectable([
  inject(CliFsToken),
  inject(RepoRootResolverPortToken),
  inject(LoadCodefastConfigUseCaseToken),
])
export class PrepareMirrorSyncUseCaseImpl implements PrepareMirrorSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly repoRootResolver: RepoRootResolverPort,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globalCliRaw: unknown;
  }): Promise<Result<MirrorSyncCommandPrelude, AppError>> {
    const globalsOutcome = parseGlobalCliOptions(args.globalCliRaw);
    if (!globalsOutcome.ok) {
      return globalsOutcome;
    }

    let rootDir: string;
    try {
      rootDir = this.repoRootResolver.findRepoRoot(args.currentWorkingDirectory);
    } catch (caughtError: unknown) {
      return err(new AppError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }

    const filterOutcome = resolveMirrorPackageArgToRelative({
      fs: this.fs,
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
      globals: globalsOutcome.value,
      rootDir,
      config: loadedOutcome.value.config,
      packageFilter: filterOutcome.value,
    });
  }
}
