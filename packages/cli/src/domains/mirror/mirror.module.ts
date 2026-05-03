import { Module } from "@codefast/di";
import { FileSystemServiceAdapter } from "#/domains/mirror/infrastructure/adapters/file-system-service.adapter";
import { MirrorSyncReporterAdapter } from "#/domains/mirror/infrastructure/adapters/mirror-sync-reporter.adapter";
import { PackageRepositoryAdapter } from "#/domains/mirror/infrastructure/adapters/package-repository.adapter";
import { SyncWorkspacePackageAdapter } from "#/domains/mirror/infrastructure/adapters/sync-workspace-package.adapter";
import { MirrorPackagePathResolverAdapter } from "#/domains/mirror/infrastructure/adapters/mirror-package-path-resolver.adapter";
import { PrepareMirrorSyncUseCase } from "#/domains/mirror/application/use-cases/prepare-mirror-sync.use-case";
import { RunMirrorSyncUseCase } from "#/domains/mirror/application/use-cases/run-mirror-sync.use-case";
import { PresentMirrorSyncPresenter } from "#/domains/mirror/presentation/presenters/present-mirror-sync-progress.presenter";
import {
  FileSystemServicePortToken,
  MirrorPackagePathPortToken,
  PrepareMirrorSyncUseCaseToken,
  MirrorSyncReporterPortToken,
  PackageRepositoryPortToken,
  PresentMirrorSyncProgressPresenterToken,
  RunMirrorSyncUseCaseToken,
  SyncWorkspacePackagePortToken,
} from "#/domains/mirror/composition/tokens";
import { ShellInfrastructureModule } from "#/shell/shell.module";
import { createOptionalCliPortTelemetryActivation } from "#/shell/wiring/optional-cli-port-telemetry-activation";

export const MirrorModule = Module.create("cli-mirror", (moduleBuilder) => {
  moduleBuilder.import(ShellInfrastructureModule);

  moduleBuilder
    .bind(MirrorPackagePathPortToken)
    .to(MirrorPackagePathResolverAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(MirrorPackagePathPortToken));

  moduleBuilder
    .bind(PackageRepositoryPortToken)
    .to(PackageRepositoryAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(PackageRepositoryPortToken));

  moduleBuilder
    .bind(FileSystemServicePortToken)
    .to(FileSystemServiceAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(FileSystemServicePortToken));

  moduleBuilder
    .bind(MirrorSyncReporterPortToken)
    .to(MirrorSyncReporterAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(MirrorSyncReporterPortToken));

  moduleBuilder.bind(SyncWorkspacePackagePortToken).to(SyncWorkspacePackageAdapter).singleton();

  moduleBuilder
    .bind(PresentMirrorSyncProgressPresenterToken)
    .to(PresentMirrorSyncPresenter)
    .singleton();

  moduleBuilder.bind(PrepareMirrorSyncUseCaseToken).to(PrepareMirrorSyncUseCase).singleton();
  moduleBuilder.bind(RunMirrorSyncUseCaseToken).to(RunMirrorSyncUseCase).singleton();
});
