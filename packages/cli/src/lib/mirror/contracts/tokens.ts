import { token } from "@codefast/di";
import type { FileSystemServicePort } from "#/lib/mirror/application/ports/file-system-service.port";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import type { PackageRepositoryPort } from "#/lib/mirror/application/ports/package-repository.port";
import type { SyncWorkspacePackagePort } from "#/lib/mirror/application/ports/sync-workspace-package.port";
import type { WorkspaceServicePort } from "#/lib/mirror/application/ports/workspace-service.port";
import type { PrepareMirrorSyncUseCase } from "#/lib/mirror/application/use-cases/prepare-mirror-sync.use-case";
import type { RunMirrorSyncUseCase } from "#/lib/mirror/application/use-cases/run-mirror-sync.use-case";

export const WorkspaceServicePortToken = token<WorkspaceServicePort>("WorkspaceServicePort");
export const PackageRepositoryPortToken = token<PackageRepositoryPort>("PackageRepositoryPort");
export const FileSystemServicePortToken = token<FileSystemServicePort>("FileSystemServicePort");
export const MirrorSyncReporterPortToken = token<MirrorSyncReporterPort>("MirrorSyncReporterPort");
export const SyncWorkspacePackagePortToken = token<SyncWorkspacePackagePort>(
  "SyncWorkspacePackagePort",
);

export const RunMirrorSyncUseCaseToken = token<RunMirrorSyncUseCase>("RunMirrorSyncUseCase");
export const PrepareMirrorSyncUseCaseToken = token<PrepareMirrorSyncUseCase>(
  "PrepareMirrorSyncUseCase",
);
