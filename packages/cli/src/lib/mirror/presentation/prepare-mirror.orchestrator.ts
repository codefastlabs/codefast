import { inject, injectable } from "@codefast/di";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import { appError } from "#/lib/core/domain/errors.domain";
import { err, ok } from "#/lib/core/domain/result.model";
import { parseGlobalCliOptions } from "#/lib/core/presentation/global-cli-options.presenter";
import { findRepoRoot } from "#/lib/infra/workspace/repo-root.adapter";
import { resolveMirrorPackageArgToRelative } from "#/lib/mirror/presentation/resolve-mirror-package-arg.presenter";
import {
  AppOrchestratorToken,
  CliFsToken,
  type AppOrchestrator,
  type PrepareMirrorOrchestrator as PrepareMirrorOrchestratorContract,
} from "#/lib/tokens";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";

@injectable([inject(CliFsToken), inject(AppOrchestratorToken)])
export class PrepareMirrorOrchestrator implements PrepareMirrorOrchestratorContract {
  constructor(
    private readonly fs: CliFs,
    private readonly appOrchestrator: AppOrchestrator,
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
      return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
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
    const loadedOutcome = await this.appOrchestrator.tryLoadCodefastConfig(rootDir);
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
