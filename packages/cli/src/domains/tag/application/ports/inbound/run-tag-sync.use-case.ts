import type { TagSyncExecutionInput } from "#/domains/tag/application/requests/tag-sync-execution-input";
import type { TagSyncResult } from "#/domains/tag/domain/types.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface RunTagSyncUseCase {
  execute(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>>;
}
