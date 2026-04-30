import type { CodefastConfig } from "#/domains/config/domain/schema.domain";
import type { TagProgressListener } from "#/domains/tag/domain/types.domain";
import type { TagSyncRunRequest } from "#/domains/tag/application/requests/tag-sync.request";

export interface TagCommandPrelude {
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly resolvedTargetPath: string | undefined;
}

export type TagSyncExecutionInput = TagSyncRunRequest & {
  listener?: TagProgressListener;
};
