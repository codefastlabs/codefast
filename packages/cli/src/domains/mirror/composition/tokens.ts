import { token } from "@codefast/di";
import type { FileSystemServicePort } from "#/domains/mirror/application/ports/outbound/file-system-service.port";
import type { MirrorPackagePathPort } from "#/domains/mirror/application/ports/outbound/mirror-package-path.port";
import type { MirrorSyncReporterPort } from "#/domains/mirror/application/ports/outbound/mirror-sync-reporter.port";
import type { PackageRepositoryPort } from "#/domains/mirror/application/ports/outbound/package-repository.port";
import type { SyncWorkspacePackagePort } from "#/domains/mirror/application/ports/outbound/sync-workspace-package.port";
import type { PrepareMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/prepare-mirror-sync.port";
import type { RunMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/run-mirror-sync.port";
import type { MirrorSyncProgressListener } from "#/domains/mirror/application/ports/presenting/present-mirror-sync-progress.presenter";

export const PackageRepositoryPortToken = token<PackageRepositoryPort>("PackageRepositoryPort");
export const MirrorPackagePathPortToken = token<MirrorPackagePathPort>("MirrorPackagePathPort");

export const FileSystemServicePortToken = token<FileSystemServicePort>("FileSystemServicePort");
export const MirrorSyncReporterPortToken = token<MirrorSyncReporterPort>("MirrorSyncReporterPort");
export const SyncWorkspacePackagePortToken = token<SyncWorkspacePackagePort>(
  "SyncWorkspacePackagePort",
);

export const RunMirrorSyncUseCaseToken = token<RunMirrorSyncPort>("RunMirrorSyncUseCase");
export const PrepareMirrorSyncUseCaseToken = token<PrepareMirrorSyncPort>(
  "PrepareMirrorSyncUseCase",
);
export const PresentMirrorSyncProgressPresenterToken = token<MirrorSyncProgressListener>(
  "PresentMirrorSyncProgressPresenter",
);
