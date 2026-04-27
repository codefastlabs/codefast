import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { PresentTagSyncResultPresenter } from "#/lib/tag/contracts/tag-sync-result-presenter.contract";
import type { TagProgressListener } from "#/lib/tag/domain/types.domain";

export const PresentTagSyncResultPresenterToken: Token<PresentTagSyncResultPresenter> =
  token<PresentTagSyncResultPresenter>("PresentTagSyncResultPresenter");

export const TagSyncProgressListenerToken: Token<TagProgressListener> =
  token<TagProgressListener>("TagSyncProgressListener");
