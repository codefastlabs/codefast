import { Module } from "@codefast/di";
import { PresentTagSyncResultPresenterImpl } from "#/lib/tag/presentation/present-tag-sync-result.presenter";
import { TagSyncProgressListener } from "#/lib/tag/presentation/tag-sync-progress-listener.presenter";
import {
  PresentTagSyncResultPresenterToken,
  TagSyncProgressListenerToken,
} from "#/lib/tag/adapters/primary/cli/presentation.tokens";
import { PresentationModule } from "#/lib/core/presentation/presentation.module";

export const TagPresentationModule = Module.create("cli-tag-presentation", (moduleBuilder) => {
  moduleBuilder.import(PresentationModule);
  moduleBuilder
    .bind(PresentTagSyncResultPresenterToken)
    .to(PresentTagSyncResultPresenterImpl)
    .singleton();
  moduleBuilder.bind(TagSyncProgressListenerToken).to(TagSyncProgressListener).singleton();
});
