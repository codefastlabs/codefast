import { injectable } from "@codefast/di";
import type {
  CodefastAfterWriteHook,
  CodefastArrangeConfig,
} from "#lib/config/domain/schema.domain";
import { appError, type AppError } from "#lib/core/domain/errors.domain";
import { err, ok, type Result } from "#lib/core/domain/result.model";
import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import type { ArrangeSyncRunRequest } from "#lib/arrange/application/requests/arrange-sync.request";
import {
  ArrangeFileProcessorToken,
  ArrangeTargetScannerToken,
  CliFsToken,
  CliLoggerToken,
  type ArrangeFileProcessorService,
  type ArrangeTargetScannerService,
  type RunArrangeSyncUseCase,
} from "#lib/tokens";

async function runArrangeOnAfterWriteHook(
  logger: CliLogger,
  hook: CodefastAfterWriteHook | undefined,
  modifiedFiles: string[],
): Promise<void> {
  if (!hook || modifiedFiles.length === 0) {
    return;
  }
  try {
    await hook({ files: modifiedFiles });
  } catch (caughtHookError: unknown) {
    logger.err(`[arrange] onAfterWrite hook failed: ${messageFromCaughtUnknown(caughtHookError)}`);
  }
}

/**
 * Preview/apply orchestration: resolves target path, runs grouping pipeline, optional hook.
 */
@injectable([
  CliFsToken,
  CliLoggerToken,
  ArrangeTargetScannerToken,
  ArrangeFileProcessorToken,
] as const)
export class RunArrangeSyncUseCaseImpl implements RunArrangeSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly logger: CliLogger,
    private readonly targetScanner: ArrangeTargetScannerService,
    private readonly fileProcessor: ArrangeFileProcessorService,
  ) {}

  async execute(request: ArrangeSyncRunRequest): Promise<Result<number, AppError>> {
    void request.rootDir;
    if (!this.fs.existsSync(request.targetPath)) {
      const notFoundError = appError("NOT_FOUND", `Not found: ${request.targetPath}`);
      this.logger.err(notFoundError.message);
      return err(notFoundError);
    }

    const filePaths = this.targetScanner.scanTarget({
      targetPath: request.targetPath,
      fs: this.fs,
    });
    const modifiedFiles: string[] = [];
    let totalFound = 0;
    let totalChanged = 0;

    const groupOptions = {
      write: request.write,
      withClassName: !!request.withClassName,
      cnImport: request.cnImport,
    };

    for (const filePath of filePaths) {
      const fileProcessResult = this.fileProcessor.processFile({
        filePath,
        options: groupOptions,
        logger: this.logger,
      });
      totalFound += fileProcessResult.totalFound;
      totalChanged += fileProcessResult.changed;
      if (fileProcessResult.changed > 0) {
        modifiedFiles.push(fileProcessResult.filePath);
      }
    }

    this.logger.out(
      `\nTotal: ${filePaths.length} file(s), ${totalFound} site(s) (cn/tv/JSX className) to review.`,
    );
    if (request.write) {
      this.logger.out(`Applied: ${totalChanged} site(s) updated.`);
    } else {
      this.logger.out(
        `(Run "apply" to write changes, or "pnpm cli:arrange-apply" / "pnpm exec codefast arrange apply")`,
      );
    }

    const shouldShowCascadeHint = request.write ? totalChanged > 0 : totalFound > 0;
    if (shouldShowCascadeHint) {
      this.logger.out(
        "Note: class order may change across concern groups — smoke-test the UI if you rely on cascade order.",
      );
    }

    if (request.write && modifiedFiles.length > 0) {
      const arrangeConfig = request.config as CodefastArrangeConfig | undefined;
      await runArrangeOnAfterWriteHook(this.logger, arrangeConfig?.onAfterWrite, modifiedFiles);
    }

    return ok(0);
  }
}
