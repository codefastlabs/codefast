import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import type { TagSyncResult } from "#/lib/tag/domain/types.domain";
import type { TagSyncExecutionInput } from "#/lib/tag/contracts/models";

export interface RunTagSyncUseCase {
  execute(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>>;
}
