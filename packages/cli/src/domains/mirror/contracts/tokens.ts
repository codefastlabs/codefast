import { token } from "@codefast/di";
import type { FileSystemServicePort } from "#/domains/mirror/application/outbound/file-system-service.outbound-port";
import type { MirrorPackagePathPort } from "#/domains/mirror/application/outbound/mirror-package-path.outbound-port";
import type { MirrorSyncReporterPort } from "#/domains/mirror/application/outbound/mirror-sync-reporter.outbound-port";
import type { PackageRepositoryPort } from "#/domains/mirror/application/outbound/package-repository.outbound-port";
import type { SyncWorkspacePackagePort } from "#/domains/mirror/application/outbound/sync-workspace-package.outbound-port";
import type { PrepareMirrorSyncUseCase } from "#/domains/mirror/application/inbound/prepare-mirror-sync.use-case";
import type { RunMirrorSyncUseCase } from "#/domains/mirror/application/inbound/run-mirror-sync.use-case";

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
