import type { MirrorSyncRunRequest } from "#/domains/mirror/application/requests/mirror-sync.request";
import type { GlobalStats } from "#/domains/mirror/domain/types.domain";
import type { AppError } from "#/shell/domain/errors.domain";
import type { Result } from "#/shell/domain/result.model";

export interface RunMirrorSyncUseCasePort {
  execute(request: MirrorSyncRunRequest): Promise<Result<GlobalStats, AppError>>;
}
