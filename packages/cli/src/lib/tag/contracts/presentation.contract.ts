import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import type { TagSyncResult } from "#/lib/tag/domain/types.domain";
import type { TagCommandPrelude } from "#/lib/tag/contracts/models";

export interface PrepareTagOrchestrator {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
    readonly globalCliRaw: unknown;
  }): Promise<Result<TagCommandPrelude, AppError>>;
}

export interface PresentTagSyncResultPresenter {
  present(result: TagSyncResult, rootDir: string): number;
}
