import { Module } from "@codefast/di";
import {
  CreateTagProgressListenerPresenterToken,
  PrepareTagOrchestratorToken,
  PresentTagSyncResultPresenterToken,
} from "#/lib/tag/contracts/tokens";
import { CreateTagProgressListenerPresenterImpl } from "#/lib/tag/presentation/create-tag-progress-listener.presenter";
import { PrepareTagOrchestrator } from "#/lib/tag/presentation/prepare-tag.orchestrator";
import { PresentTagSyncResultPresenterImpl } from "#/lib/tag/presentation/present-tag-sync-result.presenter";
import { PresentationModule } from "#/lib/core/presentation/presentation.module";

export const TagPresentationModule = Module.create("cli-tag-presentation", (moduleBuilder) => {
  moduleBuilder.import(PresentationModule);
  moduleBuilder.bind(PrepareTagOrchestratorToken).to(PrepareTagOrchestrator).singleton();
  moduleBuilder
    .bind(PresentTagSyncResultPresenterToken)
    .to(PresentTagSyncResultPresenterImpl)
    .singleton();
  moduleBuilder
    .bind(CreateTagProgressListenerPresenterToken)
    .to(CreateTagProgressListenerPresenterImpl)
    .singleton();
});
