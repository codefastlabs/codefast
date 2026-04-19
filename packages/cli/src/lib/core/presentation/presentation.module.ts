import { Module } from "@codefast/di";
import { PrepareArrangeOrchestrator } from "#/lib/arrange/presentation/prepare-arrange.orchestrator";
import { PresentAnalyzeReportPresenterImpl } from "#/lib/arrange/presentation/present-analyze-report.presenter";
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

export const PresentationModule = Module.create("cli-presentation", (api) => {
  api.bind(TryLoadCodefastConfigPresenterToken).to(TryLoadCodefastConfigPresenterImpl).singleton();

  api.bind(PrepareArrangeOrchestratorToken).to(PrepareArrangeOrchestrator).singleton();

  api.bind(PrepareMirrorOrchestratorToken).to(PrepareMirrorOrchestrator).singleton();

  api.bind(PrepareTagOrchestratorToken).to(PrepareTagOrchestrator).singleton();

  api.bind(PresentAnalyzeReportPresenterToken).to(PresentAnalyzeReportPresenterImpl).singleton();

  api.bind(PresentTagSyncResultPresenterToken).to(PresentTagSyncResultPresenterImpl).singleton();

  api
    .bind(CreateTagProgressListenerPresenterToken)
    .to(CreateTagProgressListenerPresenterImpl)
    .singleton();

  api.bind(AppOrchestratorToken).to(AppOrchestratorImpl).singleton();
});
