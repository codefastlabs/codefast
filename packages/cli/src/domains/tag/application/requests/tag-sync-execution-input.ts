import type { TagSyncRunRequest } from "#/domains/tag/application/requests/tag-sync.request";
import type { TagProgressListener } from "#/domains/tag/domain/types.domain";

export type TagSyncExecutionInput = TagSyncRunRequest & {
  readonly listener?: TagProgressListener | undefined;
};
