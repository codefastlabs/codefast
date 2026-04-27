import { Module } from "@codefast/di";
import { SyncWorkspacePackageServiceImpl } from "#/lib/mirror/application/services/sync-workspace-package.service";
import { PrepareMirrorSyncUseCaseImpl } from "#/lib/mirror/application/use-cases/prepare-mirror-sync.use-case";
import { RunMirrorSyncUseCaseImpl } from "#/lib/mirror/application/use-cases/run-mirror-sync.use-case";
import { FileSystemServiceAdapter } from "#/lib/mirror/infrastructure/file-system-service.adapter";
import { MirrorSyncReporterAdapter } from "#/lib/mirror/infrastructure/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#/lib/mirror/infrastructure/package-repository.adapter";
import { WorkspaceServiceAdapter } from "#/lib/mirror/infrastructure/workspace-service.adapter";
import {
  FileSystemServicePortToken,
  PrepareMirrorSyncUseCaseToken,
  MirrorSyncReporterPortToken,
  PackageRepositoryPortToken,
  RunMirrorSyncUseCaseToken,
  SyncWorkspacePackageServiceToken,
  WorkspaceServicePortToken,
} from "#/lib/mirror/contracts/tokens";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import { InfrastructureModule } from "#/lib/core/infrastructure/infrastructure.module";
import { withOptionalPortTelemetry } from "#/lib/core/infrastructure/logging-decorator.adapter";

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

  moduleBuilder
    .bind(SyncWorkspacePackageServiceToken)
    .to(SyncWorkspacePackageServiceImpl)
    .singleton();

  moduleBuilder.bind(PrepareMirrorSyncUseCaseToken).to(PrepareMirrorSyncUseCaseImpl).singleton();
  moduleBuilder.bind(RunMirrorSyncUseCaseToken).to(RunMirrorSyncUseCaseImpl).singleton();
});
