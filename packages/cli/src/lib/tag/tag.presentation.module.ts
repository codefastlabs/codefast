import { Module } from "@codefast/di";
import {
  PresentTagSyncResultPresenterToken,
  TagSyncProgressListenerToken,
} from "#/lib/tag/contracts/tokens";
import { PresentTagSyncResultPresenterImpl } from "#/lib/tag/presentation/present-tag-sync-result.presenter";
import { TagSyncProgressListener } from "#/lib/tag/presentation/tag-sync-progress-listener.presenter";
import { PresentationModule } from "#/lib/core/presentation/presentation.module";

export const TagPresentationModule = Module.create("cli-tag-presentation", (moduleBuilder) => {
  moduleBuilder.import(PresentationModule);
  moduleBuilder
    .bind(PresentTagSyncResultPresenterToken)
    .to(PresentTagSyncResultPresenterImpl)
    .singleton();
  moduleBuilder.bind(TagSyncProgressListenerToken).to(TagSyncProgressListener).singleton();
});
