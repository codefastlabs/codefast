import { Module } from "@codefast/di";
import { FileSystemServiceAdapter } from "#/lib/mirror/adapters/secondary/file-system-service.adapter";
import { MirrorSyncReporterAdapter } from "#/lib/mirror/adapters/secondary/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#/lib/mirror/adapters/secondary/package-repository.adapter";
import { SyncWorkspacePackageAdapter } from "#/lib/mirror/adapters/secondary/sync-workspace-package.adapter";
import { WorkspaceServiceAdapter } from "#/lib/mirror/adapters/secondary/workspace-service.adapter";
import { PrepareMirrorSyncUseCaseImpl } from "#/lib/mirror/application/use-cases/prepare-mirror-sync.use-case";
import { RunMirrorSyncUseCaseImpl } from "#/lib/mirror/application/use-cases/run-mirror-sync.use-case";
import {
  FileSystemServicePortToken,
  PrepareMirrorSyncUseCaseToken,
  MirrorSyncReporterPortToken,
  PackageRepositoryPortToken,
  RunMirrorSyncUseCaseToken,
  SyncWorkspacePackagePortToken,
  WorkspaceServicePortToken,
} from "#/lib/mirror/contracts/tokens";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import { InfrastructureModule } from "#/lib/core/infrastructure/infrastructure.module";
import { withOptionalPortTelemetry } from "#/lib/core/infrastructure/port-telemetry.decorator";

export const MirrorModule = Module.create("cli-mirror", (moduleBuilder) => {
  moduleBuilder.import(InfrastructureModule);

  moduleBuilder
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

  moduleBuilder
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

  moduleBuilder
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

  moduleBuilder
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

  moduleBuilder.bind(SyncWorkspacePackagePortToken).to(SyncWorkspacePackageAdapter).singleton();

  moduleBuilder.bind(PrepareMirrorSyncUseCaseToken).to(PrepareMirrorSyncUseCaseImpl).singleton();
  moduleBuilder.bind(RunMirrorSyncUseCaseToken).to(RunMirrorSyncUseCaseImpl).singleton();
});
