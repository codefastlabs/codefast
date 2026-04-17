import { Module } from "@codefast/di";
import { PrepareArrangeOrchestrator } from "#/lib/arrange/presentation/prepare-arrange.orchestrator";
import { presentAnalyzeCliReport } from "#/lib/arrange/presentation/present-analyze-cli.presenter";
import { tryLoadCodefastConfig } from "#/lib/core/presentation/load-codefast-config.presenter";
import { PrepareMirrorOrchestrator } from "#/lib/mirror/presentation/prepare-mirror.orchestrator";
import {
  createTagProgressListener,
  presentTagSyncCliResult,
} from "#/lib/tag/presentation/tag-sync.presenter";
import { PrepareTagOrchestrator } from "#/lib/tag/presentation/prepare-tag.orchestrator";
import {
  AppOrchestratorToken,
  CliFsToken,
  CliLoggerToken,
  ConfigLoaderPortToken,
  CreateTagProgressListenerPresenterToken,
  PrepareArrangeOrchestratorToken,
  PrepareMirrorOrchestratorToken,
  PrepareTagOrchestratorToken,
  PresentAnalyzeReportPresenterToken,
  PresentTagSyncResultPresenterToken,
  TryLoadCodefastConfigPresenterToken,
} from "#/lib/tokens";

export const PresentationModule = Module.create("cli-presentation", (api) => {
  api
    .bind(TryLoadCodefastConfigPresenterToken)
    .toResolved(
      (fs, logger, configLoader) => (rootDir) =>
        tryLoadCodefastConfig({ fs, logger }, configLoader, rootDir),
      [CliFsToken, CliLoggerToken, ConfigLoaderPortToken] as const,
    )
    .singleton();

  api.bind(PrepareArrangeOrchestratorToken).to(PrepareArrangeOrchestrator).singleton();

  api.bind(PrepareMirrorOrchestratorToken).to(PrepareMirrorOrchestrator).singleton();

  api.bind(PrepareTagOrchestratorToken).to(PrepareTagOrchestrator).singleton();

  api
    .bind(PresentAnalyzeReportPresenterToken)
    .toResolved(
      (logger) => (resolvedTargetPath, report) =>
        presentAnalyzeCliReport(logger, resolvedTargetPath, report),
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(PresentTagSyncResultPresenterToken)
    .toResolved((logger) => (result, rootDir) => presentTagSyncCliResult(logger, result, rootDir), [
      CliLoggerToken,
    ] as const)
    .singleton();

  api
    .bind(CreateTagProgressListenerPresenterToken)
    .toDynamic(() => createTagProgressListener)
    .singleton();

  api
    .bind(AppOrchestratorToken)
    .toResolved(
      (tryLoadCodefastConfigPresenter) => ({
        tryLoadCodefastConfig: tryLoadCodefastConfigPresenter,
      }),
      [TryLoadCodefastConfigPresenterToken] as const,
    )
    .singleton();
});
