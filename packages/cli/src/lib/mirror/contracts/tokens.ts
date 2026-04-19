import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { FileSystemServicePort } from "#/lib/mirror/application/ports/file-system-service.port";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import type { PackageRepositoryPort } from "#/lib/mirror/application/ports/package-repository.port";
import type { SyncWorkspacePackageService } from "#/lib/mirror/application/ports/sync-workspace-package.port";
import type { WorkspaceServicePort } from "#/lib/mirror/application/ports/workspace-service.port";
import type { PrepareMirrorOrchestrator } from "#/lib/mirror/contracts/presentation.contract";
import type { RunMirrorSyncUseCase } from "#/lib/mirror/contracts/use-cases.contract";

export const WorkspaceServicePortToken: Token<WorkspaceServicePort> =
  token<WorkspaceServicePort>("WorkspaceServicePort");
export const PackageRepositoryPortToken: Token<PackageRepositoryPort> =
  token<PackageRepositoryPort>("PackageRepositoryPort");
export const FileSystemServicePortToken: Token<FileSystemServicePort> =
  token<FileSystemServicePort>("FileSystemServicePort");
export const MirrorSyncReporterPortToken: Token<MirrorSyncReporterPort> =
  token<MirrorSyncReporterPort>("MirrorSyncReporterPort");
export const SyncWorkspacePackageServiceToken: Token<SyncWorkspacePackageService> =
  token<SyncWorkspacePackageService>("SyncWorkspacePackageService");

export const RunMirrorSyncUseCaseToken: Token<RunMirrorSyncUseCase> =
  token<RunMirrorSyncUseCase>("RunMirrorSyncUseCase");
export const PrepareMirrorOrchestratorToken: Token<PrepareMirrorOrchestrator> =
  token<PrepareMirrorOrchestrator>("PrepareMirrorOrchestrator");
