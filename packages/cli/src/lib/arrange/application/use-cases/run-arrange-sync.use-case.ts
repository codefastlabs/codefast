import { inject, injectable } from "@codefast/di";
import type {
  CodefastAfterWriteHook,
  CodefastArrangeConfig,
} from "#/lib/config/domain/schema.domain";
import type { AppError } from "#/lib/core/domain/errors.domain";
import { appError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { err, ok } from "#/lib/core/domain/result.model";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { ArrangeSyncRunRequest } from "#/lib/arrange/application/requests/arrange-sync.request";
import type { ArrangeRunResult } from "#/lib/arrange/domain/types.domain";
import {
  ArrangeFileProcessorToken,
  ArrangeTargetScannerToken,
  CliFsToken,
  type ArrangeFileProcessorService,
  type ArrangeTargetScannerService,
  type RunArrangeSyncUseCase,
} from "#/lib/tokens";

async function runOnAfterWriteHook(
  hook: CodefastAfterWriteHook | undefined,
  modifiedFiles: string[],
): Promise<string | null> {
  if (!hook || modifiedFiles.length === 0) {
    return null;
  }
  try {
    await hook({ files: modifiedFiles });
    return null;
  } catch (caughtHookError: unknown) {
    return `[arrange] onAfterWrite hook failed: ${messageFromCaughtUnknown(caughtHookError)}`;
  }
}

/**
 * Preview/apply orchestration: scans target, runs grouping pipeline, runs optional hook.
 * All presentation (logging, exit codes) belongs to the command layer.
 */
@injectable([
  inject(CliFsToken),
  inject(ArrangeTargetScannerToken),
  inject(ArrangeFileProcessorToken),
])
export class RunArrangeSyncUseCaseImpl implements RunArrangeSyncUseCase {
  constructor(
    private readonly fs: CliFs,
    private readonly targetScanner: ArrangeTargetScannerService,
    private readonly fileProcessor: ArrangeFileProcessorService,
  ) {}

  async execute(request: ArrangeSyncRunRequest): Promise<Result<ArrangeRunResult, AppError>> {
    if (!this.fs.existsSync(request.targetPath)) {
      return err(appError("NOT_FOUND", `Not found: ${request.targetPath}`));
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
      });
      totalFound += fileProcessResult.totalFound;
      totalChanged += fileProcessResult.changed;
      if (fileProcessResult.changed > 0) {
        modifiedFiles.push(fileProcessResult.filePath);
      }
    }

    const arrangeConfig = request.config as CodefastArrangeConfig | undefined;
    const hookError =
      request.write && modifiedFiles.length > 0
        ? await runOnAfterWriteHook(arrangeConfig?.onAfterWrite, modifiedFiles)
        : null;

    return ok({ filePaths, modifiedFiles, totalFound, totalChanged, hookError });
  }
}
