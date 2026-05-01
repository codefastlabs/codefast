import type { TagProgressListener } from "#/domains/tag/domain/types.domain";

/**
 * Application presenting port for tag sync progress lines.
 * Matches {@link TagProgressListener} so the same implementation can satisfy domain callbacks.
 */
export interface PresentTagSyncProgressPresenter extends TagProgressListener {}
