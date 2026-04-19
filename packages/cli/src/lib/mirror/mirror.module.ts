import { Module } from "@codefast/di";
import { SyncWorkspacePackageServiceImpl } from "#/lib/mirror/application/services/sync-workspace-package.service";
import { RunMirrorSyncUseCaseImpl } from "#/lib/mirror/application/use-cases/run-mirror-sync.use-case";
import { FileSystemServiceAdapter } from "#/lib/mirror/infra/file-system-service.adapter";
import { MirrorSyncReporterAdapter } from "#/lib/mirror/infra/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#/lib/mirror/infra/package-repository.adapter";
import { WorkspaceServiceAdapter } from "#/lib/mirror/infra/workspace-service.adapter";
import { withOptionalPortTelemetry } from "#/lib/core/infra/logging-decorator.adapter";
import {
  CliLoggerToken,
  FileSystemServicePortToken,
  MirrorSyncReporterPortToken,
  PackageRepositoryPortToken,
  RunMirrorSyncUseCaseToken,
  SyncWorkspacePackageServiceToken,
  WorkspaceServicePortToken,
} from "#/lib/tokens";

export const MirrorModule = Module.create("cli-mirror", (api) => {
  api
    .bind(WorkspaceServicePortToken)
    .to(WorkspaceServiceAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "WorkspaceServicePort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  api
    .bind(PackageRepositoryPortToken)
    .to(PackageRepositoryAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "PackageRepositoryPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  api
    .bind(FileSystemServicePortToken)
    .to(FileSystemServiceAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "FileSystemServicePort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  api
    .bind(MirrorSyncReporterPortToken)
    .to(MirrorSyncReporterAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "MirrorSyncReporterPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  api.bind(SyncWorkspacePackageServiceToken).to(SyncWorkspacePackageServiceImpl).singleton();

  api.bind(RunMirrorSyncUseCaseToken).to(RunMirrorSyncUseCaseImpl).singleton();
});
