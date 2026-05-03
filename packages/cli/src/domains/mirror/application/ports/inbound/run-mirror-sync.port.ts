import type { MirrorSyncExecutionInput } from "#/domains/mirror/application/requests/mirror-sync-execution-input";
import type { GlobalStats } from "#/domains/mirror/domain/types.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface RunMirrorSyncPort {
  execute(input: MirrorSyncExecutionInput): Promise<Result<GlobalStats, AppError>>;
}
