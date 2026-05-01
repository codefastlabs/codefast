import { inject, injectable } from "@codefast/di";
import {
  ArrangeFileProcessorPortToken,
  ArrangeTargetScannerPortToken,
} from "#/domains/arrange/composition/tokens";
import type { ArrangeFileProcessorPort } from "#/domains/arrange/application/ports/outbound/arrange-file-processor.port";
import type { ArrangeTargetScannerPort } from "#/domains/arrange/application/ports/outbound/arrange-target-scanner.port";
import type {
  CodefastAfterWriteHook,
  CodefastArrangeConfig,
} from "#/domains/config/domain/schema.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";
import { ok } from "#/shell/domain/result.model";
import { messageFromCaughtUnknown } from "#/shell/domain/caught-unknown-message.value-object";
import type { ArrangeSyncRunRequest } from "#/domains/arrange/application/requests/arrange-sync.request";
import type { ArrangeRunResult } from "#/domains/arrange/domain/types.domain";
import type { GroupFileWorkPlan } from "#/domains/arrange/domain/arrange-grouping.service";
import type { RunArrangeSyncUseCase } from "#/domains/arrange/application/ports/inbound/run-arrange-sync.use-case";

@injectable([inject(ArrangeTargetScannerPortToken), inject(ArrangeFileProcessorPortToken)])
export class RunArrangeSyncUseCaseImpl implements RunArrangeSyncUseCase {
  constructor(
    private readonly targetScanner: ArrangeTargetScannerPort,
    private readonly fileProcessor: ArrangeFileProcessorPort,
  ) {}

  private async runOnAfterWriteHook(
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
        ? await this.runOnAfterWriteHook(arrangeConfig?.onAfterWrite, modifiedFiles)
        : null;

    return ok({ filePaths, modifiedFiles, totalFound, totalChanged, hookError, previewPlans });
  }
}
