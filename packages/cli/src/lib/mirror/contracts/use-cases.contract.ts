import type { MirrorSyncRunRequest } from "#/lib/mirror/application/requests/mirror-sync.request";
import type { GlobalStats } from "#/lib/mirror/domain/types.domain";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";

export interface RunMirrorSyncUseCase {
  execute(request: MirrorSyncRunRequest): Promise<Result<GlobalStats, AppError>>;
}
