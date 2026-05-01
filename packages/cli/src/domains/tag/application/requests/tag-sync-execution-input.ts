import type { TagSyncRunRequest } from "#/domains/tag/application/requests/tag-sync.request";
import type { PresentTagSyncProgressPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-progress.presenter";

export type TagSyncExecutionInput = TagSyncRunRequest & {
  readonly listener?: PresentTagSyncProgressPresenter | undefined;
};
