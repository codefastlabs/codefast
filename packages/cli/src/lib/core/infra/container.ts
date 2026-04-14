import type { AppError } from "#lib/core/domain/errors";
import type { Result } from "#lib/core/domain/result";
import type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
import { withCliPortTelemetry, isCliTelemetryEnabled } from "#lib/core/infra/logging-decorator";
import { analyzeDirectory } from "#lib/arrange/application/analyze";
import type { AnalyzeDirectoryDeps } from "#lib/arrange/application/analyze";
import type { ArrangeAnalyzeDirectoryRequest } from "#lib/arrange/application/requests/analyze-directory.request";
import type { ArrangeSyncRunRequest } from "#lib/arrange/application/requests/arrange-sync.request";
import { runArrangeSync } from "#lib/arrange/application/run-target";
import type { ArrangeSyncDeps } from "#lib/arrange/application/run-target";
import type { AnalyzeReport } from "#lib/arrange/domain/types";
import { DomainSourceParserAdapter } from "#lib/arrange/infra/domain-source-parser.adapter";
import { FileWalkerAdapter } from "#lib/arrange/infra/file-walker.adapter";
import { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";
import { runMirrorSync } from "#lib/mirror/application/sync";
import type { MirrorSyncRunDeps } from "#lib/mirror/application/sync";
import type { MirrorSyncRunRequest } from "#lib/mirror/application/requests/mirror-sync.request";
import { FileSystemServiceAdapter } from "#lib/mirror/infra/file-system-service.adapter";
import { mirrorSyncReporterAdapter } from "#lib/mirror/infra/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#lib/mirror/infra/package-repository.adapter";
import { WorkspaceServiceAdapter } from "#lib/mirror/infra/workspace-service.adapter";
import { runTagSync } from "#lib/tag/application/engine";
import type { TagSyncExecutionInput, TagSyncRunDeps } from "#lib/tag/application/engine";
import type { TagSyncResult } from "#lib/tag/domain/types";
import { tagTargetResolverAdapter } from "#lib/tag/infra/tag-target-resolver.adapter";

/**
 * Composition root: wires default infra adapters and exposes thin use-case facades.
 */
export type CliContainer = {
  readonly fs: CliFs;
  readonly logger: CliLogger;
  readonly arrange: {
    readonly deps: AnalyzeDirectoryDeps & ArrangeSyncDeps;
    analyzeDirectory(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
    runArrangeSync(request: ArrangeSyncRunRequest): Promise<Result<number, AppError>>;
  };
  readonly mirror: {
    readonly deps: MirrorSyncRunDeps;
    runMirrorSync(request: MirrorSyncRunRequest): Promise<Result<number, AppError>>;
  };
  readonly tag: {
    readonly deps: TagSyncRunDeps;
    runTagSync(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>>;
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
  };

  return {
    fs,
    logger,
    arrange: {
      deps: arrangeDeps,
      analyzeDirectory: (request) => analyzeDirectory(request, arrangeDeps),
      runArrangeSync: (request) => runArrangeSync(request, arrangeDeps),
    },
    mirror: {
      deps: mirrorDeps,
      runMirrorSync: (request) => runMirrorSync(request, mirrorDeps),
    },
    tag: {
      deps: tagDeps,
      runTagSync: (input) => runTagSync(input, tagDeps),
    },
  };
}
