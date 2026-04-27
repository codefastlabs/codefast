import type { TagSyncResult } from "#/lib/tag/domain/types.domain";

export interface PresentTagSyncResultPresenter {
  present(result: TagSyncResult, rootDir: string): number;
}
