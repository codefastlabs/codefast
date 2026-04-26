import type { ArrangeAnalyzeDirectoryRequest } from "#/lib/arrange/application/requests/analyze-directory.request";
import type { ArrangeSyncRunRequest } from "#/lib/arrange/application/requests/arrange-sync.request";
import type { ArrangeSuggestGroupsRequest } from "#/lib/arrange/application/requests/suggest-groups.request";
import type { AnalyzeReport, ArrangeRunResult } from "#/lib/arrange/domain/types.domain";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import type {
  ArrangeSuggestGroupsOutput,
  ArrangeTargetWorkspaceAndConfig,
} from "#/lib/arrange/contracts/models";

export interface AnalyzeDirectoryUseCase {
  execute(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
}

export interface RunArrangeSyncUseCase {
  execute(request: ArrangeSyncRunRequest): Promise<Result<ArrangeRunResult, AppError>>;
}

export interface SuggestCnGroupsUseCase {
  execute(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput;
}

export interface PrepareArrangeWorkspaceUseCase {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>>;
}
