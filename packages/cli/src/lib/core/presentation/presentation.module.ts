import { Module } from "@codefast/di";
import { PrepareArrangeOrchestrator } from "#/lib/arrange/presentation/prepare-arrange.orchestrator";
import { PresentAnalyzeReportPresenterImpl } from "#/lib/arrange/presentation/present-analyze-report.presenter";
import { InfraModule } from "#/lib/core/infra/infra.module";
import { PrepareMirrorOrchestrator } from "#/lib/mirror/presentation/prepare-mirror.orchestrator";
import { AppOrchestratorImpl } from "#/lib/core/presentation/app-orchestrator.service";
import { TryLoadCodefastConfigPresenterImpl } from "#/lib/core/presentation/try-load-codefast-config.presenter";
import { CreateTagProgressListenerPresenterImpl } from "#/lib/tag/presentation/create-tag-progress-listener.presenter";
import { PrepareTagOrchestrator } from "#/lib/tag/presentation/prepare-tag.orchestrator";
import { PresentTagSyncResultPresenterImpl } from "#/lib/tag/presentation/present-tag-sync-result.presenter";
import {
  AppOrchestratorToken,
  CreateTagProgressListenerPresenterToken,
  PrepareArrangeOrchestratorToken,
  PrepareMirrorOrchestratorToken,
  PrepareTagOrchestratorToken,
  PresentAnalyzeReportPresenterToken,
  PresentTagSyncResultPresenterToken,
  TryLoadCodefastConfigPresenterToken,
} from "#/lib/tokens";

export const PresentationModule = Module.create("cli-presentation", (moduleBuilder) => {
  moduleBuilder.import(InfraModule);

  moduleBuilder
    .bind(TryLoadCodefastConfigPresenterToken)
    .to(TryLoadCodefastConfigPresenterImpl)
    .singleton();

  moduleBuilder.bind(PrepareArrangeOrchestratorToken).to(PrepareArrangeOrchestrator).singleton();

  moduleBuilder.bind(PrepareMirrorOrchestratorToken).to(PrepareMirrorOrchestrator).singleton();

  moduleBuilder.bind(PrepareTagOrchestratorToken).to(PrepareTagOrchestrator).singleton();

  moduleBuilder
    .bind(PresentAnalyzeReportPresenterToken)
    .to(PresentAnalyzeReportPresenterImpl)
    .singleton();

  moduleBuilder
    .bind(PresentTagSyncResultPresenterToken)
    .to(PresentTagSyncResultPresenterImpl)
    .singleton();

  moduleBuilder
    .bind(CreateTagProgressListenerPresenterToken)
    .to(CreateTagProgressListenerPresenterImpl)
    .singleton();

  moduleBuilder.bind(AppOrchestratorToken).to(AppOrchestratorImpl).singleton();
});
