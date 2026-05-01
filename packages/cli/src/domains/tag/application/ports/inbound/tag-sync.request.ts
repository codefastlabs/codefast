import type { TagProgressListener } from "#/domains/tag/domain/types.domain";
import type { TagSyncRunRequest } from "#/domains/tag/application/requests/tag-sync.request";

export type TagSyncExecutionInput = TagSyncRunRequest & {
  readonly listener?: TagProgressListener | undefined;
};
