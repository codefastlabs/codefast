import type { ArrangeSyncRunRequest } from "#/domains/arrange/application/requests/arrange-sync.request";
import type { ArrangeRunResult } from "#/domains/arrange/domain/types.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface RunArrangeSyncPort {
  execute(request: ArrangeSyncRunRequest): Promise<Result<ArrangeRunResult, AppError>>;
}
