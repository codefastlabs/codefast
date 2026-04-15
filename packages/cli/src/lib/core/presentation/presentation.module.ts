import { Module } from "@codefast/di";
import { resolveArrangeCliTargetPath } from "#lib/arrange/presentation/resolve-arrange-cli-target.presenter";
import { presentAnalyzeCliReport } from "#lib/arrange/presentation/present-analyze-cli.presenter";
import { tryLoadCodefastConfig } from "#lib/core/presentation/load-codefast-config.presenter";
import { messageFromCaughtUnknown } from "#lib/core/application/utils/caught-unknown-message.util";
import { appError } from "#lib/core/domain/errors.domain";
import { err, ok } from "#lib/core/domain/result.model";
import { parseGlobalCliOptions } from "#lib/core/presentation/global-cli-options.presenter";
import { findRepoRoot } from "#lib/infra/workspace/repo-root.adapter";
import { resolveMirrorPackageArgToRelative } from "#lib/mirror/presentation/resolve-mirror-package-arg.presenter";
import {
  createTagProgressListener,
  presentTagSyncCliResult,
} from "#lib/tag/presentation/tag-sync.presenter";
import { resolveTagCliTargetPath } from "#lib/tag/presentation/resolve-tag-cli-target.presenter";
import { resolveTagWorkspaceRootPath } from "#lib/tag/presentation/resolve-tag-workspace-root.presenter";
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
  WorkspaceContextBinderToken,
} from "#lib/tokens";

export const PresentationModule = Module.create("cli-presentation", (api) => {
  api
    .bind(TryLoadCodefastConfigPresenterToken)
    .toResolved(
      (fs, logger, configLoader) => (rootDir) =>
        tryLoadCodefastConfig({ fs, logger }, configLoader, rootDir),
      [CliFsToken, CliLoggerToken, ConfigLoaderPortToken],
    )
    .singleton()
    .build();

  api
    .bind(PrepareArrangeOrchestratorToken)
    .toResolved(
      (fs, appOrchestrator) => async (args) => {
        const resolvedTarget = resolveArrangeCliTargetPath({
          fs,
          currentWorkingDirectory: args.currentWorkingDirectory,
          rawTarget: args.rawTarget,
        });
        if (!fs.existsSync(resolvedTarget)) {
          return err(appError("NOT_FOUND", `Not found: ${resolvedTarget}`));
        }
        let rootDir: string;
        try {
          rootDir = findRepoRoot(fs);
        } catch (caughtError: unknown) {
          return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
        }
        appOrchestrator.bindWorkspaceContext({ rootDir });
        const loadedOutcome = await appOrchestrator.tryLoadCodefastConfig(rootDir);
        if (!loadedOutcome.ok) {
          return loadedOutcome;
        }
        return ok({
          resolvedTarget,
          rootDir,
          config: loadedOutcome.value.config,
        });
      },
      [CliFsToken, AppOrchestratorToken],
    )
    .singleton()
    .build();

  api
    .bind(PrepareMirrorOrchestratorToken)
    .toResolved(
      (fs, appOrchestrator) => async (args) => {
        const globalsOutcome = parseGlobalCliOptions(args.globalCliRaw);
        if (!globalsOutcome.ok) {
          return globalsOutcome;
        }
        let rootDir: string;
        try {
          rootDir = findRepoRoot(fs);
        } catch (caughtError: unknown) {
          return err(appError("INFRA_FAILURE", messageFromCaughtUnknown(caughtError), caughtError));
        }
        const filterOutcome = resolveMirrorPackageArgToRelative({
          fs,
          rootDir,
          packageArg: args.packageArg,
          currentWorkingDirectory: args.currentWorkingDirectory,
        });
        if (!filterOutcome.ok) {
          return filterOutcome;
        }
        appOrchestrator.bindWorkspaceContext({ rootDir, globalCliRaw: args.globalCliRaw });
        const loadedOutcome = await appOrchestrator.tryLoadCodefastConfig(rootDir);
        if (!loadedOutcome.ok) {
          return loadedOutcome;
        }
        return ok({
          globals: globalsOutcome.value,
          rootDir,
          config: loadedOutcome.value.config,
          packageFilter: filterOutcome.value,
        });
      },
      [CliFsToken, AppOrchestratorToken],
    )
    .singleton()
    .build();

  api
    .bind(PrepareTagOrchestratorToken)
    .toResolved(
      (fs, logger, appOrchestrator) => async (args) => {
        const globalsOutcome = parseGlobalCliOptions(args.globalCliRaw);
        if (!globalsOutcome.ok) {
          return globalsOutcome;
        }
        const rootDir = resolveTagWorkspaceRootPath({
          resolveStrictRepoRoot: () => findRepoRoot(fs),
          logger,
          currentWorkingDirectory: args.currentWorkingDirectory,
        });
        appOrchestrator.bindWorkspaceContext({ rootDir, globalCliRaw: args.globalCliRaw });
        const loadedOutcome = await appOrchestrator.tryLoadCodefastConfig(rootDir);
        if (!loadedOutcome.ok) {
          return loadedOutcome;
        }
        const resolvedTargetPath = resolveTagCliTargetPath({
          fs,
          currentWorkingDirectory: args.currentWorkingDirectory,
          rawTarget: args.rawTarget,
        });
        return ok({
          rootDir,
          config: loadedOutcome.value.config,
          resolvedTargetPath,
        });
      },
      [CliFsToken, CliLoggerToken, AppOrchestratorToken],
    )
    .singleton()
    .build();

  api
    .bind(PresentAnalyzeReportPresenterToken)
    .toResolved(
      (logger) => (resolvedTargetPath, report) =>
        presentAnalyzeCliReport(logger, resolvedTargetPath, report),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(PresentTagSyncResultPresenterToken)
    .toResolved(
      (logger) => (result, rootDir) => presentTagSyncCliResult(logger, result, rootDir),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(CreateTagProgressListenerPresenterToken)
    .toDynamic(() => createTagProgressListener)
    .singleton()
    .build();

  api
    .bind(AppOrchestratorToken)
    .toResolved(
      (bindWorkspaceContext, tryLoadCodefastConfigPresenter) => ({
        bindWorkspaceContext,
        tryLoadCodefastConfig: tryLoadCodefastConfigPresenter,
      }),
      [WorkspaceContextBinderToken, TryLoadCodefastConfigPresenterToken],
    )
    .singleton()
    .build();
});
