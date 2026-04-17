import { token, type Token } from "@codefast/di";
import type { ArrangeAnalyzeDirectoryRequest } from "#/lib/arrange/application/requests/analyze-directory.request";
import type { ArrangeSyncRunRequest } from "#/lib/arrange/application/requests/arrange-sync.request";
import type { ArrangeSuggestGroupsRequest } from "#/lib/arrange/application/requests/suggest-groups.request";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import type { FileWalkerPort } from "#/lib/arrange/application/ports/file-walker.port";
import type { GroupFilePreviewPort } from "#/lib/arrange/application/ports/group-file-preview.port";
import type { ArrangeSuggestGroupsOutput } from "#/lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import type {
  AnalyzeReport,
  ArrangeGroupFileOptions,
  GroupFileResult,
} from "#/lib/arrange/domain/types.domain";
import type { ArrangeTargetWorkspaceAndConfig } from "#/lib/arrange/presentation/arrange-prelude.types";
import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";
import type { CliFs, CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { CliPath } from "#/lib/core/application/ports/path.port";
import type { AppError } from "#/lib/core/domain/errors.domain";
import type { Result } from "#/lib/core/domain/result.model";
import type { FileSystemServicePort } from "#/lib/mirror/application/ports/file-system-service.port";
import type { MirrorSyncReporterPort } from "#/lib/mirror/application/ports/mirror-sync-reporter.port";
import type { PackageRepositoryPort } from "#/lib/mirror/application/ports/package-repository.port";
import type { SyncWorkspacePackageService } from "#/lib/mirror/application/ports/sync-workspace-package.port";
import type { WorkspaceServicePort } from "#/lib/mirror/application/ports/workspace-service.port";
import type { MirrorSyncRunRequest } from "#/lib/mirror/application/requests/mirror-sync.request";
import type { MirrorSyncCommandPrelude } from "#/lib/mirror/presentation/mirror-prelude.types";
import type { TagSinceWriterPort } from "#/lib/tag/application/ports/tag-since-writer.port";
import type { TagTargetResolverPort } from "#/lib/tag/application/ports/target-resolver.port";
import type { TypeScriptTreeWalkPort } from "#/lib/tag/application/ports/typescript-tree-walk.port";
import type { TagVersionResolverPort } from "#/lib/tag/application/ports/tag-version-resolver.port";
import type { TagSyncExecutionInput } from "#/lib/tag/application/use-cases/run-tag-sync.use-case";
import type { TagProgressListener, TagSyncResult } from "#/lib/tag/domain/types.domain";
import type { TagCommandPrelude } from "#/lib/tag/presentation/tag-prelude.types";

export type AnalyzeDirectoryUseCase = {
  execute(request: ArrangeAnalyzeDirectoryRequest): Result<AnalyzeReport, AppError>;
};

export type RunArrangeSyncUseCase = {
  execute(request: ArrangeSyncRunRequest): Promise<Result<number, AppError>>;
};

export type ArrangeTargetScannerService = {
  scanTarget(args: { readonly targetPath: string; readonly fs: CliFs }): string[];
};

export type ArrangeFileProcessorService = {
  processFile(args: {
    readonly filePath: string;
    readonly options: ArrangeGroupFileOptions;
    readonly logger: CliLogger;
  }): GroupFileResult;
};

export type SuggestCnGroupsUseCase = {
  execute(request: ArrangeSuggestGroupsRequest): ArrangeSuggestGroupsOutput;
};

export type RunMirrorSyncUseCase = {
  execute(request: MirrorSyncRunRequest): Promise<Result<number, AppError>>;
};

export type RunTagSyncUseCase = {
  execute(input: TagSyncExecutionInput): Promise<Result<TagSyncResult, AppError>>;
};

export type PrepareArrangeOrchestrator = {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
  }): Promise<Result<ArrangeTargetWorkspaceAndConfig, AppError>>;
};

export type PrepareMirrorOrchestrator = {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly packageArg: string | undefined;
    readonly globalCliRaw: unknown;
  }): Promise<Result<MirrorSyncCommandPrelude, AppError>>;
};

export type PrepareTagOrchestrator = {
  execute(args: {
    readonly currentWorkingDirectory: string;
    readonly rawTarget: string | undefined;
    readonly globalCliRaw: unknown;
  }): Promise<Result<TagCommandPrelude, AppError>>;
};

export type PresentAnalyzeReportPresenter = (
  resolvedTargetPath: string,
  report: AnalyzeReport,
) => void;

export type PresentTagSyncResultPresenter = (result: TagSyncResult, rootDir: string) => number;

export type CreateTagProgressListenerPresenter = (
  emitLine: (line: string) => void,
) => TagProgressListener;

export type TryLoadCodefastConfigPresenter = (
  rootDir: string,
) => Promise<Result<{ config: CodefastConfig }, AppError>>;

export type AppOrchestrator = {
  tryLoadCodefastConfig(rootDir: string): Promise<Result<{ config: CodefastConfig }, AppError>>;
};

export const CliFsToken: Token<CliFs> = token<CliFs>("CliFs");
export const CliLoggerToken: Token<CliLogger> = token<CliLogger>("CliLogger");
export const CliPathToken: Token<CliPath> = token<CliPath>("CliPath");
export const ConfigLoaderPortToken: Token<ConfigLoaderPort> =
  token<ConfigLoaderPort>("ConfigLoaderPort");

export const FileWalkerPortToken: Token<FileWalkerPort> = token<FileWalkerPort>("FileWalkerPort");
export const DomainSourceParserPortToken: Token<DomainSourceParserPort> =
  token<DomainSourceParserPort>("DomainSourceParserPort");
export const GroupFilePreviewPortToken: Token<GroupFilePreviewPort> =
  token<GroupFilePreviewPort>("GroupFilePreviewPort");
export const ArrangeTargetScannerToken: Token<ArrangeTargetScannerService> =
  token<ArrangeTargetScannerService>("ArrangeTargetScannerService");
export const ArrangeFileProcessorToken: Token<ArrangeFileProcessorService> =
  token<ArrangeFileProcessorService>("ArrangeFileProcessorService");

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

export const TagTargetResolverPortToken: Token<TagTargetResolverPort> =
  token<TagTargetResolverPort>("TagTargetResolverPort");
export const TypeScriptTreeWalkPortToken: Token<TypeScriptTreeWalkPort> =
  token<TypeScriptTreeWalkPort>("TypeScriptTreeWalkPort");
export const TagSinceWriterPortToken: Token<TagSinceWriterPort> =
  token<TagSinceWriterPort>("TagSinceWriterPort");
export const TagVersionResolverPortToken: Token<TagVersionResolverPort> =
  token<TagVersionResolverPort>("TagVersionResolverPort");

export const AnalyzeDirectoryUseCaseToken: Token<AnalyzeDirectoryUseCase> =
  token<AnalyzeDirectoryUseCase>("AnalyzeDirectoryUseCase");
export const RunArrangeSyncUseCaseToken: Token<RunArrangeSyncUseCase> =
  token<RunArrangeSyncUseCase>("RunArrangeSyncUseCase");
export const SuggestCnGroupsUseCaseToken: Token<SuggestCnGroupsUseCase> =
  token<SuggestCnGroupsUseCase>("SuggestCnGroupsUseCase");
export const RunMirrorSyncUseCaseToken: Token<RunMirrorSyncUseCase> =
  token<RunMirrorSyncUseCase>("RunMirrorSyncUseCase");
export const RunTagSyncUseCaseToken: Token<RunTagSyncUseCase> =
  token<RunTagSyncUseCase>("RunTagSyncUseCase");
export const PrepareArrangeOrchestratorToken: Token<PrepareArrangeOrchestrator> =
  token<PrepareArrangeOrchestrator>("PrepareArrangeOrchestrator");
export const PrepareMirrorOrchestratorToken: Token<PrepareMirrorOrchestrator> =
  token<PrepareMirrorOrchestrator>("PrepareMirrorOrchestrator");
export const PrepareTagOrchestratorToken: Token<PrepareTagOrchestrator> =
  token<PrepareTagOrchestrator>("PrepareTagOrchestrator");
export const PresentAnalyzeReportPresenterToken: Token<PresentAnalyzeReportPresenter> =
  token<PresentAnalyzeReportPresenter>("PresentAnalyzeReportPresenter");
export const PresentTagSyncResultPresenterToken: Token<PresentTagSyncResultPresenter> =
  token<PresentTagSyncResultPresenter>("PresentTagSyncResultPresenter");
export const CreateTagProgressListenerPresenterToken: Token<CreateTagProgressListenerPresenter> =
  token<CreateTagProgressListenerPresenter>("CreateTagProgressListenerPresenter");
export const TryLoadCodefastConfigPresenterToken: Token<TryLoadCodefastConfigPresenter> =
  token<TryLoadCodefastConfigPresenter>("TryLoadCodefastConfigPresenter");
export const AppOrchestratorToken: Token<AppOrchestrator> =
  token<AppOrchestrator>("AppOrchestrator");
