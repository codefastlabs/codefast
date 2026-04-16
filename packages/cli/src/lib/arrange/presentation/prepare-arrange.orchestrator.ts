import { injectable } from "@codefast/di";
import { appError } from "#lib/core/domain/errors.domain";
import { err, ok } from "#lib/core/domain/result.model";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import { findRepoRoot } from "#lib/infra/workspace/repo-root.adapter";
import { resolveArrangeCliTargetPath } from "#lib/arrange/presentation/resolve-arrange-cli-target.presenter";
import {
  AppOrchestratorToken,
  CliFsToken,
  type AppOrchestrator,
  type PrepareArrangeOrchestrator as PrepareArrangeOrchestratorContract,
} from "#lib/tokens";
import type { CliFs } from "#lib/core/application/ports/cli-io.port";

@injectable([CliFsToken, AppOrchestratorToken] as const)
export class PrepareArrangeOrchestrator implements PrepareArrangeOrchestratorContract {
  constructor(
    private readonly fs: CliFs,
    private readonly appOrchestrator: AppOrchestrator,
  ) {}

  async execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }) {
    const resolvedTarget = resolveArrangeCliTargetPath({
      fs: this.fs,
      currentWorkingDirectory: args.currentWorkingDirectory,
      rawTarget: args.rawTarget,
    });
    if (!this.fs.existsSync(resolvedTarget)) {
      return err(appError("NOT_FOUND", `Not found: ${resolvedTarget}`));
    }
    let rootDir: string;
    try {
      rootDir = findRepoRoot(this.fs);
    } catch (caughtError: unknown) {
      return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
    }
    this.appOrchestrator.bindWorkspaceContext({ rootDir });
    const loadedOutcome = await this.appOrchestrator.tryLoadCodefastConfig(rootDir);
    if (!loadedOutcome.ok) {
      return loadedOutcome;
    }
    return ok({
      resolvedTarget,
      rootDir,
      config: loadedOutcome.value.config,
    });
  }
}
