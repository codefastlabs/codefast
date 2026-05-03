import type { MirrorSyncRunRequest } from "#/domains/mirror/application/requests/mirror-sync.request";
import type { MirrorSyncProgressListener } from "#/domains/mirror/application/ports/presenting/present-mirror-sync-progress.presenter";

export type MirrorSyncExecutionInput = MirrorSyncRunRequest & {
  readonly listener?: MirrorSyncProgressListener | undefined;
};
