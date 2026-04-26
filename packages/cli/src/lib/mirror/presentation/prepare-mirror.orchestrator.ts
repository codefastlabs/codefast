import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { AppError } from "#/lib/core/domain/errors.domain";
import { err, ok } from "#/lib/core/domain/result.model";
import { parseGlobalCliOptions } from "#/lib/core/presentation/global-cli-options.presenter";
import { findRepoRoot } from "#/lib/infra/workspace/repo-root.adapter";
import type { PrepareMirrorOrchestrator as PrepareMirrorOrchestratorContract } from "#/lib/mirror/contracts/presentation.contract";
import { resolveMirrorPackageArgToRelative } from "#/lib/mirror/presentation/resolve-mirror-package-arg.presenter";
import type { LoadCodefastConfigUseCase } from "#/lib/core/application/load-codefast-config.use-case";
import { CliFsToken, LoadCodefastConfigUseCaseToken } from "#/lib/core/contracts/tokens";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";

@injectable([inject(CliFsToken), inject(LoadCodefastConfigUseCaseToken)])
export class PrepareMirrorOrchestrator implements PrepareMirrorOrchestratorContract {
  constructor(
    private readonly fs: CliFs,
    private readonly loadCodefastConfig: LoadCodefastConfigUseCase,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globalCliRaw: unknown;
  }) {
    const globalsOutcome = parseGlobalCliOptions(args.globalCliRaw);
    if (!globalsOutcome.ok) {
      return globalsOutcome;
    }
    let rootDir: string;
    try {
      rootDir = findRepoRoot(this.fs, args.currentWorkingDirectory);
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
