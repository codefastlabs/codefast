import { token } from "@codefast/di";
import type { PresentTagSyncResultPresenter } from "#/lib/tag/contracts/tag-sync-result-presenter.contract";
import type { TagProgressListener } from "#/lib/tag/domain/types.domain";

export const PresentTagSyncResultPresenterToken = token<PresentTagSyncResultPresenter>(
  "PresentTagSyncResultPresenter",
);

export const TagSyncProgressListenerToken = token<TagProgressListener>("TagSyncProgressListener");
