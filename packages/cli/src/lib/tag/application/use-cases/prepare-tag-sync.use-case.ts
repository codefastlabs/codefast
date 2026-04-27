import { inject, injectable } from "@codefast/di";
import { parseGlobalCliOptions } from "#/lib/core/application/parse-global-cli-options.util";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { RepoRootResolverPort } from "#/lib/core/application/ports/repo-root-resolver.port";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";
import {
  CliFsToken,
  CliLoggerToken,
  LoadCodefastConfigUseCaseToken,
  RepoRootResolverPortToken,
} from "#/lib/core/contracts/tokens";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { ok } from "#/lib/core/domain/result.model";
import type { TagCommandPrelude } from "#/lib/tag/contracts/models";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { resolveTagCliTargetPath } from "#/lib/tag/application/resolve-tag-cli-target-path.util";

export interface PrepareTagSyncUseCase {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
    readonly globalCliRaw: unknown;
  }): Promise<Result<TagCommandPrelude, AppError>>;
}

function resolveTagWorkspaceRootPath(args: {
  readonly repoRootResolver: RepoRootResolverPort;
  readonly logger: CliLogger;
  readonly currentWorkingDirectory: string;
}): string {
  try {
    return args.repoRootResolver.findRepoRoot(args.currentWorkingDirectory);
  } catch (caughtRepoRootError: unknown) {
    args.logger.out(
      `[tag] workspace root auto-detection failed (${messageFromCaughtUnknown(caughtRepoRootError)}), using cwd=${args.currentWorkingDirectory}`,
    );
    return args.currentWorkingDirectory;
  }
}

@injectable([
  inject(CliFsToken),
  inject(CliLoggerToken),
  inject(RepoRootResolverPortToken),
  inject(LoadCodefastConfigUseCaseToken),
])
export class PrepareTagSyncUseCaseImpl implements PrepareTagSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly logger: CliLogger,
    private readonly repoRootResolver: RepoRootResolverPort,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
    readonly globalCliRaw: unknown;
  }): Promise<Result<TagCommandPrelude, AppError>> {
    const globalsOutcome = parseGlobalCliOptions(args.globalCliRaw);
    if (!globalsOutcome.ok) {
      return globalsOutcome;
    }

    const rootDir = resolveTagWorkspaceRootPath({
      repoRootResolver: this.repoRootResolver,
      logger: this.logger,
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
