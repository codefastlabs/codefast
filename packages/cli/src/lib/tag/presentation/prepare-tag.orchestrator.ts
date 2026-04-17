import { injectable } from "@codefast/di";
import { ok } from "#/lib/core/domain/result.model";
import { parseGlobalCliOptions } from "#/lib/core/presentation/global-cli-options.presenter";
import { findRepoRoot } from "#/lib/infra/workspace/repo-root.adapter";
import { resolveTagCliTargetPath } from "#/lib/tag/presentation/resolve-tag-cli-target.presenter";
import { resolveTagWorkspaceRootPath } from "#/lib/tag/presentation/resolve-tag-workspace-root.presenter";
import {
  AppOrchestratorToken,
  CliFsToken,
  CliLoggerToken,
  type AppOrchestrator,
  type PrepareTagOrchestrator as PrepareTagOrchestratorContract,
} from "#/lib/tokens";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";

@injectable([CliFsToken, CliLoggerToken, AppOrchestratorToken] as const)
export class PrepareTagOrchestrator implements PrepareTagOrchestratorContract {
  constructor(
    private readonly fs: CliFs,
    private readonly logger: CliLogger,
    private readonly appOrchestrator: AppOrchestrator,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
    readonly globalCliRaw: unknown;
  }) {
    const globalsOutcome = parseGlobalCliOptions(args.globalCliRaw);
    if (!globalsOutcome.ok) {
      return globalsOutcome;
    }
    const rootDir = resolveTagWorkspaceRootPath({
      resolveStrictRepoRoot: () => findRepoRoot(this.fs, args.currentWorkingDirectory),
      logger: this.logger,
      currentWorkingDirectory: args.currentWorkingDirectory,
    });
    const loadedOutcome = await this.appOrchestrator.tryLoadCodefastConfig(rootDir);
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
