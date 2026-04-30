import type { TagSyncResult } from "#/domains/tag/domain/types.domain";

export interface PresentTagSyncResultPresenter {
  present(result: TagSyncResult, rootDir: string): number;
}
