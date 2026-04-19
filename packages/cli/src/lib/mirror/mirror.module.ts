import { Module } from "@codefast/di";
import { SyncWorkspacePackageServiceImpl } from "#/lib/mirror/application/services/sync-workspace-package.service";
import { RunMirrorSyncUseCaseImpl } from "#/lib/mirror/application/use-cases/run-mirror-sync.use-case";
import { FileSystemServiceAdapter } from "#/lib/mirror/infra/file-system-service.adapter";
import { MirrorSyncReporterAdapter } from "#/lib/mirror/infra/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#/lib/mirror/infra/package-repository.adapter";
import { WorkspaceServiceAdapter } from "#/lib/mirror/infra/workspace-service.adapter";
import { InfraModule } from "#/lib/core/infra/infra.module";
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

export const MirrorModule = Module.create("cli-mirror", (moduleBuilder) => {
  moduleBuilder.import(InfraModule);

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

  moduleBuilder.bind(RunMirrorSyncUseCaseToken).to(RunMirrorSyncUseCaseImpl).singleton();
});
