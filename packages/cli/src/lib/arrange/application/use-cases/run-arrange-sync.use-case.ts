import { inject, injectable } from "@codefast/di";
import {
  ArrangeFileProcessorServiceToken,
  ArrangeTargetScannerServiceToken,
} from "#/lib/arrange/contracts/tokens";
import type {
  ArrangeFileProcessorService,
  ArrangeTargetScannerService,
} from "#/lib/arrange/contracts/services.contract";
import type { RunArrangeSyncUseCase } from "#/lib/arrange/contracts/use-cases.contract";
import type {
  CodefastAfterWriteHook,
  CodefastArrangeConfig,
} from "#/lib/config/domain/schema.domain";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import { ok } from "#/lib/core/domain/result.model";
import { messageFromCaughtUnknown } from "#/lib/core/application/utils/caught-unknown-message.util";
import type { ArrangeSyncRunRequest } from "#/lib/arrange/application/requests/arrange-sync.request";
import type { ArrangeRunResult } from "#/lib/arrange/domain/types.domain";
import type { GroupFileWorkPlan } from "#/lib/arrange/domain/arrange-grouping.service";

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

@injectable([inject(ArrangeTargetScannerServiceToken), inject(ArrangeFileProcessorServiceToken)])
export class RunArrangeSyncUseCaseImpl implements RunArrangeSyncUseCase {
  constructor(
    private readonly targetScanner: ArrangeTargetScannerService,
    private readonly fileProcessor: ArrangeFileProcessorService,
  ) {}

  async execute(request: ArrangeSyncRunRequest): Promise<Result<ArrangeRunResult, AppError>> {
    const filePaths = this.targetScanner.scanTarget({ targetPath: request.targetPath });
    const modifiedFiles: string[] = [];
    const previewPlans: GroupFileWorkPlan[] = [];
    let totalFound = 0;
    let totalChanged = 0;

    const groupOptions = {
      write: request.write,
      withClassName: !!request.withClassName,
      cnImport: request.cnImport,
    };

    for (const filePath of filePaths) {
      const fileProcessResult = this.fileProcessor.processFile({ filePath, options: groupOptions });
      totalFound += fileProcessResult.totalFound;
      totalChanged += fileProcessResult.changed;
      if (fileProcessResult.changed > 0) {
        modifiedFiles.push(fileProcessResult.filePath);
      }
      if (fileProcessResult.workPlan) {
        previewPlans.push(fileProcessResult.workPlan);
      }
    }

    const arrangeConfig = request.config as CodefastArrangeConfig | undefined;
    const hookError =
      request.write && modifiedFiles.length > 0
        ? await runOnAfterWriteHook(arrangeConfig?.onAfterWrite, modifiedFiles)
        : null;

    return ok({ filePaths, modifiedFiles, totalFound, totalChanged, hookError, previewPlans });
  }
}
