import { Module } from "@codefast/di";
import { SyncWorkspacePackageServiceImpl } from "#lib/mirror/application/services/sync-workspace-package.service";
import { RunMirrorSyncUseCaseImpl } from "#lib/mirror/application/use-cases/run-mirror-sync.use-case";
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
  CliLoggerToken,
  FileSystemServicePortToken,
  MirrorSyncReporterPortToken,
  PackageRepositoryPortToken,
  RunMirrorSyncUseCaseToken,
  SyncWorkspacePackageServiceToken,
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
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(PackageRepositoryPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("PackageRepositoryPort", new PackageRepositoryAdapter(), logger),
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(FileSystemServicePortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("FileSystemServicePort", new FileSystemServiceAdapter(), logger),
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(MirrorSyncReporterPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("MirrorSyncReporterPort", mirrorSyncReporterAdapter, logger),
      [CliLoggerToken] as const,
    )
    .singleton();

  api.bind(SyncWorkspacePackageServiceToken).to(SyncWorkspacePackageServiceImpl).singleton();

  api.bind(RunMirrorSyncUseCaseToken).to(RunMirrorSyncUseCaseImpl).singleton();
});
