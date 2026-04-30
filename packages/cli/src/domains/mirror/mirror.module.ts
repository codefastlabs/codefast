import { Module } from "@codefast/di";
import { FileSystemServiceAdapter } from "#/domains/mirror/infrastructure/adapters/file-system-service.adapter";
import { MirrorSyncReporterAdapter } from "#/domains/mirror/infrastructure/adapters/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#/domains/mirror/infrastructure/adapters/package-repository.adapter";
import { SyncWorkspacePackageAdapter } from "#/domains/mirror/infrastructure/adapters/sync-workspace-package.adapter";
import { WorkspaceServiceAdapter } from "#/domains/mirror/infrastructure/adapters/workspace-service.adapter";
import { MirrorPackageArgResolverImpl } from "#/domains/mirror/application/services/mirror-package-arg-resolver.service";
import { PrepareMirrorSyncUseCaseImpl } from "#/domains/mirror/application/use-cases/prepare-mirror-sync.use-case";
import { RunMirrorSyncUseCaseImpl } from "#/domains/mirror/application/use-cases/run-mirror-sync.use-case";
import { PackageFilterPathResolver } from "#/domains/mirror/infrastructure/package-filter-resolver.service";
import { WorkspacePackageDiscovery } from "#/domains/mirror/infrastructure/workspace-packages.service";
import {
  FileSystemServicePortToken,
  MirrorPackageArgResolverPortToken,
  PackageFilterPathResolverPortToken,
  PrepareMirrorSyncUseCaseToken,
  MirrorSyncReporterPortToken,
  PackageRepositoryPortToken,
  RunMirrorSyncUseCaseToken,
  SyncWorkspacePackagePortToken,
  WorkspacePackageDiscoveryPortToken,
  WorkspaceServicePortToken,
} from "#/domains/mirror/contracts/tokens";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";
import { ShellInfrastructureModule } from "#/shell/shell.module";
import { withOptionalPortTelemetry } from "#/shell/infrastructure/port-telemetry.decorator";

export const MirrorModule = Module.create("cli-mirror", (moduleBuilder) => {
  moduleBuilder.import(ShellInfrastructureModule);

  moduleBuilder.bind(PackageFilterPathResolverPortToken).to(PackageFilterPathResolver).singleton();

  moduleBuilder.bind(WorkspacePackageDiscoveryPortToken).to(WorkspacePackageDiscovery).singleton();

  moduleBuilder
    .bind(WorkspaceServicePortToken)
    .to(WorkspaceServiceAdapter)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "WorkspaceServicePort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder
    .bind(PackageRepositoryPortToken)
    .to(PackageRepositoryAdapter)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "PackageRepositoryPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder
    .bind(FileSystemServicePortToken)
    .to(FileSystemServiceAdapter)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "FileSystemServicePort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder
    .bind(MirrorSyncReporterPortToken)
    .to(MirrorSyncReporterAdapter)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "MirrorSyncReporterPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder.bind(SyncWorkspacePackagePortToken).to(SyncWorkspacePackageAdapter).singleton();

  moduleBuilder
    .bind(MirrorPackageArgResolverPortToken)
    .to(MirrorPackageArgResolverImpl)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "MirrorPackageArgResolverPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder.bind(PrepareMirrorSyncUseCaseToken).to(PrepareMirrorSyncUseCaseImpl).singleton();
  moduleBuilder.bind(RunMirrorSyncUseCaseToken).to(RunMirrorSyncUseCaseImpl).singleton();
});
