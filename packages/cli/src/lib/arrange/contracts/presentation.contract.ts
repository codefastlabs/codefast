import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";
import type { ArrangeTargetWorkspaceAndConfig } from "#/lib/arrange/contracts/models";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";

export interface PrepareArrangeOrchestrator {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>>;
}

export interface PresentAnalyzeReportPresenter {
  present(resolvedTargetPath: string, report: AnalyzeReport): void;
}
