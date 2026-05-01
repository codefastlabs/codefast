import type { ArrangeAnalyzeDirectoryRequest } from "#/domains/arrange/application/requests/analyze-directory.request";
import type { AnalyzeReport } from "#/domains/arrange/domain/types.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface AnalyzeDirectoryUseCasePort {
  execute(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
}
