import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import type { TagProgressListener } from "#/lib/tag/domain/types.domain";
import type { TagSyncRunRequest } from "#/lib/tag/application/requests/tag-sync.request";

export interface TagCommandPrelude {
  readonly rootDir: string;
  readonly config: CodefastConfig;
  readonly resolvedTargetPath: string | undefined;
}

export type TagSyncExecutionInput = TagSyncRunRequest & {
  listener?: TagProgressListener;
};
