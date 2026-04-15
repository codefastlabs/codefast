import type { AppError } from "#lib/core/domain/errors.domain";
import type { Result } from "#lib/core/domain/result.model";
import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import {
  withCliPortTelemetry,
  isCliTelemetryEnabled,
} from "#lib/core/infra/logging-decorator.adapter";
import { analyzeDirectory } from "#lib/arrange/application/use-cases/analyze-directory.use-case";
import type { AnalyzeDirectoryDeps } from "#lib/arrange/application/use-cases/analyze-directory.use-case";
import type { ArrangeAnalyzeDirectoryRequest } from "#lib/arrange/application/requests/analyze-directory.request";
import type { ArrangeSyncRunRequest } from "#lib/arrange/application/requests/arrange-sync.request";
import type { ArrangeSuggestGroupsRequest } from "#lib/arrange/application/requests/suggest-groups.request";
import { runArrangeSync } from "#lib/arrange/application/use-cases/run-arrange-sync.use-case";
import type { ArrangeSyncDeps } from "#lib/arrange/application/use-cases/run-arrange-sync.use-case";
import {
  suggestCnGroupsForCli,
  type ArrangeSuggestGroupsOutput,
} from "#lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import type { AnalyzeReport } from "#lib/arrange/domain/types.domain";
import { prepareArrangeTargetWorkspaceAndConfig } from "#lib/arrange/presentation/arrange-prelude.presenter";
import type { ArrangeTargetWorkspaceAndConfig } from "#lib/arrange/presentation/arrange-prelude.presenter";
import { presentAnalyzeCliReport } from "#lib/arrange/presentation/present-analyze-cli.presenter";
import { DomainSourceParserAdapter } from "#lib/arrange/infra/domain-source-parser.adapter";
import { FileWalkerAdapter } from "#lib/arrange/infra/file-walker.adapter";
import { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io.adapter";
import { runMirrorSync } from "#lib/mirror/application/use-cases/run-mirror-sync.use-case";
import type { MirrorSyncRunDeps } from "#lib/mirror/application/use-cases/run-mirror-sync.use-case";
import type { MirrorSyncRunRequest } from "#lib/mirror/application/requests/mirror-sync.request";
import { prepareMirrorSync } from "#lib/mirror/presentation/mirror-prelude.presenter";
import type { MirrorSyncCommandPrelude } from "#lib/mirror/presentation/mirror-prelude.presenter";
import { FileSystemServiceAdapter } from "#lib/mirror/infra/file-system-service.adapter";
import { mirrorSyncReporterAdapter } from "#lib/mirror/infra/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#lib/mirror/infra/package-repository.adapter";
import { WorkspaceServiceAdapter } from "#lib/mirror/infra/workspace-service.adapter";
import { runTagSync } from "#lib/tag/application/use-cases/run-tag-sync.use-case";
import type {
  TagSyncExecutionInput,
  TagSyncRunDeps,
} from "#lib/tag/application/use-cases/run-tag-sync.use-case";
import type { TagSyncResult } from "#lib/tag/domain/types.domain";
import { prepareTagSync } from "#lib/tag/presentation/tag-prelude.presenter";
import type { TagCommandPrelude } from "#lib/tag/presentation/tag-prelude.presenter";
import {
  createTagProgressListener,
  presentTagSyncCliResult,
} from "#lib/tag/presentation/tag-sync.presenter";
import { tagTargetResolverAdapter } from "#lib/tag/infra/tag-target-resolver.adapter";
import { tagTypeScriptTreeWalkAdapter } from "#lib/tag/infra/typescript-tree-walk.adapter";

/**
 * Composition root: wires default infra adapters and exposes thin use-case facades.
 */
export type CliContainer = {
  readonly fs: CliFs;
  readonly logger: CliLogger;
  readonly arrange: {
    readonly deps: AnalyzeDirectoryDeps & ArrangeSyncDeps;
    prepareTargetWorkspaceAndConfig(args: {
      readonly currentWorkingDirectory: string;
      readonly rawTarget: string | undefined;
    }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>>;
    analyzeDirectory(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
    runArrangeSync(request: ArrangeSyncRunRequest): Promise<Result<number, AppError>>;
    suggestCnGroups(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput;
    presentAnalyzeReport(resolvedTargetPath: string, report: AnalyzeReport): void;
  };
  readonly mirror: {
    readonly deps: MirrorSyncRunDeps;
    prepareMirrorSync(args: {
      readonly currentWorkingDirectory: string;
      readonly packageArg: string | undefined;
      readonly globalCliRaw: unknown;
    }): Promise<Result<MirrorSyncCommandPrelude, AppError>>;
    runMirrorSync(request: MirrorSyncRunRequest): Promise<Result<number, AppError>>;
  };
  readonly tag: {
    readonly deps: TagSyncRunDeps;
    prepareTagSync(args: {
      readonly currentWorkingDirectory: string;
      readonly rawTarget: string | undefined;
      readonly globalCliRaw: unknown;
    }): Promise<Result<TagCommandPrelude, AppError>>;
    runTagSync(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>>;
    createProgressListener(
      emitLine: (line: string) => void,
    ): ReturnType<typeof createTagProgressListener>;
    presentSyncCliResult(result: TagSyncResult, rootDir: string): number;
  };
};

function maybeTelemetry<T extends object>(
  portName: string,
  implementation: T,
  logger: CliLogger,
): T {
  if (!isCliTelemetryEnabled()) {
    return implementation;
  }
  return withCliPortTelemetry({ portName, implementation, logger });
}

export function createCliContainer(): CliContainer {
  const logger = createNodeCliLogger();
  const rawFs = createNodeCliFs();
  const fs = maybeTelemetry("CliFs", rawFs, logger);
  const fileWalker = maybeTelemetry("FileWalkerPort", new FileWalkerAdapter(logger), logger);
  const domainSourceParser = maybeTelemetry(
    "DomainSourceParserPort",
    new DomainSourceParserAdapter(logger),
    logger,
  );

  const arrangeDeps: AnalyzeDirectoryDeps & ArrangeSyncDeps = {
    fs,
    logger,
    fileWalker,
    domainSourceParser,
  };

  const mirrorDeps: MirrorSyncRunDeps = {
    fs,
    logger,
    workspaceService: maybeTelemetry("WorkspaceServicePort", new WorkspaceServiceAdapter(), logger),
    packageRepository: maybeTelemetry(
      "PackageRepositoryPort",
      new PackageRepositoryAdapter(),
      logger,
    ),
    fileSystemService: maybeTelemetry(
      "FileSystemServicePort",
      new FileSystemServiceAdapter(),
      logger,
    ),
    mirrorReporter: maybeTelemetry("MirrorSyncReporterPort", mirrorSyncReporterAdapter, logger),
  };

  const rawTagResolver = tagTargetResolverAdapter;
  const targetResolver = maybeTelemetry("TagTargetResolverPort", rawTagResolver, logger);

  const tagDeps: TagSyncRunDeps = {
    fs,
    targetResolver,
    typeScriptTreeWalk: maybeTelemetry(
      "TypeScriptTreeWalkPort",
      tagTypeScriptTreeWalkAdapter,
      logger,
    ),
  };

  let cli: CliContainer;

  cli = {
    fs,
    logger,
    arrange: {
      deps: arrangeDeps,
      prepareTargetWorkspaceAndConfig: (args) => prepareArrangeTargetWorkspaceAndConfig(cli, args),
      analyzeDirectory: (request) => analyzeDirectory(request, arrangeDeps),
      runArrangeSync: (request) => runArrangeSync(request, arrangeDeps),
      suggestCnGroups: (request) => suggestCnGroupsForCli(request),
      presentAnalyzeReport: (resolvedTargetPath, report) =>
        presentAnalyzeCliReport(logger, resolvedTargetPath, report),
    },
    mirror: {
      deps: mirrorDeps,
      prepareMirrorSync: (args) => prepareMirrorSync(cli, args),
      runMirrorSync: (request) => runMirrorSync(request, mirrorDeps),
    },
    tag: {
      deps: tagDeps,
      prepareTagSync: (args) => prepareTagSync(cli, args),
      runTagSync: (input) => runTagSync(input, tagDeps),
      createProgressListener: (emitLine) => createTagProgressListener(emitLine),
      presentSyncCliResult: (result, rootDir) => presentTagSyncCliResult(logger, result, rootDir),
    },
  };

  return cli;
}
