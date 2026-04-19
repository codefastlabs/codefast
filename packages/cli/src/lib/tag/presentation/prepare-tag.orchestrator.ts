import { inject, injectable } from "@codefast/di";
import { ok } from "#/lib/core/domain/result.model";
import { parseGlobalCliOptions } from "#/lib/core/presentation/global-cli-options.presenter";
import { findRepoRoot } from "#/lib/infra/workspace/repo-root.adapter";
import type { PrepareTagOrchestrator as PrepareTagOrchestratorContract } from "#/lib/tag/contracts/presentation.contract";
import { resolveTagCliTargetPath } from "#/lib/tag/presentation/resolve-tag-cli-target.presenter";
import { resolveTagWorkspaceRootPath } from "#/lib/tag/presentation/resolve-tag-workspace-root.presenter";
import { TryLoadCodefastConfigPresenterToken } from "#/lib/core/contracts/tokens";
import type { TryLoadCodefastConfigPresenter } from "#/lib/core/contracts/presentation.contract";
import { CliFsToken, CliLoggerToken } from "#/lib/core/operational/contracts/tokens";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";

@injectable([
  inject(CliFsToken),
  inject(CliLoggerToken),
  inject(TryLoadCodefastConfigPresenterToken),
])
export class PrepareTagOrchestrator implements PrepareTagOrchestratorContract {
  constructor(
    private readonly fs: CliFs,
    private readonly logger: CliLogger,
    private readonly tryLoadCodefastConfig: TryLoadCodefastConfigPresenter,
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
    const loadedOutcome = await this.tryLoadCodefastConfig.execute(rootDir);
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
