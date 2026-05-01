import { token } from "@codefast/di";
import type { FileSystemServicePort } from "#/domains/mirror/application/ports/file-system-service.port";
import type { MirrorPackagePathPort } from "#/domains/mirror/application/ports/mirror-package-path.port";
import type { MirrorSyncReporterPort } from "#/domains/mirror/application/ports/mirror-sync-reporter.port";
import type { PackageRepositoryPort } from "#/domains/mirror/application/ports/package-repository.port";
import type { SyncWorkspacePackagePort } from "#/domains/mirror/application/ports/sync-workspace-package.port";
import type { PrepareMirrorSyncUseCase } from "#/domains/mirror/application/use-cases/prepare-mirror-sync.use-case";
import type { RunMirrorSyncUseCase } from "#/domains/mirror/application/use-cases/run-mirror-sync.use-case";

export const PackageRepositoryPortToken = token<PackageRepositoryPort>("PackageRepositoryPort");
export const MirrorPackagePathPortToken = token<MirrorPackagePathPort>("MirrorPackagePathPort");
export const FileSystemServicePortToken = token<FileSystemServicePort>("FileSystemServicePort");
export const MirrorSyncReporterPortToken = token<MirrorSyncReporterPort>("MirrorSyncReporterPort");
export const SyncWorkspacePackagePortToken = token<SyncWorkspacePackagePort>(
  "SyncWorkspacePackagePort",
);

export const RunMirrorSyncUseCaseToken = token<RunMirrorSyncUseCase>("RunMirrorSyncUseCase");
export const PrepareMirrorSyncUseCaseToken = token<PrepareMirrorSyncUseCase>(
  "PrepareMirrorSyncUseCase",
);
