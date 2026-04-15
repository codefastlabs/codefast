import type { CliContainer } from "#lib/core/infra/cli-container.contract";
import { createCliRuntimeContainer } from "#lib/core/infra/composition-root";
import {
  AnalyzeDirectoryUseCaseToken,
  AppOrchestratorToken,
  CliFsToken,
  CreateTagProgressListenerPresenterToken,
  CliLoggerToken,
  CliPathToken,
  PrepareArrangeOrchestratorToken,
  PrepareMirrorOrchestratorToken,
  PrepareTagOrchestratorToken,
  PresentAnalyzeReportPresenterToken,
  PresentTagSyncResultPresenterToken,
  RunArrangeSyncUseCaseToken,
  RunMirrorSyncUseCaseToken,
  RunTagSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
} from "#lib/tokens";

/** Composition root: wires DI modules and exposes thin use-case facades. */
export type { CliContainer } from "#lib/core/infra/cli-container.contract";

export function createCliContainer(): CliContainer {
  const di = createCliRuntimeContainer();
  return {
    fs: di.resolve(CliFsToken),
    logger: di.resolve(CliLoggerToken),
    path: di.resolve(CliPathToken),
    appOrchestrator: di.resolve(AppOrchestratorToken),
    arrange: {
      prepareTargetWorkspaceAndConfig: di.resolve(PrepareArrangeOrchestratorToken),
      analyzeDirectory: di.resolve(AnalyzeDirectoryUseCaseToken),
      runArrangeSync: di.resolve(RunArrangeSyncUseCaseToken),
      suggestCnGroups: di.resolve(SuggestCnGroupsUseCaseToken),
      presentAnalyzeReport: di.resolve(PresentAnalyzeReportPresenterToken),
    },
    mirror: {
      prepareMirrorSync: di.resolve(PrepareMirrorOrchestratorToken),
      runMirrorSync: di.resolve(RunMirrorSyncUseCaseToken),
    },
    tag: {
      prepareTagSync: di.resolve(PrepareTagOrchestratorToken),
      runTagSync: di.resolve(RunTagSyncUseCaseToken),
      createProgressListener: di.resolve(CreateTagProgressListenerPresenterToken),
      presentSyncCliResult: di.resolve(PresentTagSyncResultPresenterToken),
    },
  };
}
