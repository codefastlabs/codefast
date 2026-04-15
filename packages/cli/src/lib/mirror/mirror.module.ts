import { Module } from "@codefast/di";
import { runMirrorSync } from "#lib/mirror/application/use-cases/run-mirror-sync.use-case";
import { FileSystemServiceAdapter } from "#lib/mirror/infra/file-system-service.adapter";
import { mirrorSyncReporterAdapter } from "#lib/mirror/infra/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#lib/mirror/infra/package-repository.adapter";
import { WorkspaceServiceAdapter } from "#lib/mirror/infra/workspace-service.adapter";
import type { CliLogger } from "#lib/core/application/ports/cli-io.port";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#lib/core/infra/logging-decorator.adapter";
import {
  CliFsToken,
  CliLoggerToken,
  CliPathToken,
  FileSystemServicePortToken,
  MirrorSyncReporterPortToken,
  PackageRepositoryPortToken,
  RunMirrorSyncUseCaseToken,
  WorkspaceServicePortToken,
} from "#lib/tokens";

function withOptionalTelemetry<T extends object>(
  portName: string,
  implementation: T,
  logger: CliLogger,
): T {
  if (!isCliTelemetryEnabled()) {
    return implementation;
  }
  return withCliPortTelemetry({ portName, implementation, logger });
}

export const MirrorModule = Module.create("cli-mirror", (api) => {
  api
    .bind(WorkspaceServicePortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("WorkspaceServicePort", new WorkspaceServiceAdapter(), logger),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(PackageRepositoryPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("PackageRepositoryPort", new PackageRepositoryAdapter(), logger),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(FileSystemServicePortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("FileSystemServicePort", new FileSystemServiceAdapter(), logger),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(MirrorSyncReporterPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("MirrorSyncReporterPort", mirrorSyncReporterAdapter, logger),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(RunMirrorSyncUseCaseToken)
    .toResolved(
      (fs, logger, path, workspaceService, packageRepository, fileSystemService, mirrorReporter) =>
        (request) =>
          runMirrorSync(request, {
            fs,
            logger,
            path,
            workspaceService,
            packageRepository,
            fileSystemService,
            mirrorReporter,
          }),
      [
        CliFsToken,
        CliLoggerToken,
        CliPathToken,
        WorkspaceServicePortToken,
        PackageRepositoryPortToken,
        FileSystemServicePortToken,
        MirrorSyncReporterPortToken,
      ],
    )
    .singleton()
    .build();
});
