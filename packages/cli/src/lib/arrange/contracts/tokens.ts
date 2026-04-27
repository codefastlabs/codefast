import { token } from "@codefast/di";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import type { FileWalkerPort } from "#/lib/arrange/application/ports/file-walker.port";
import type { GroupFilePreviewPort } from "#/lib/arrange/application/ports/group-file-preview.port";
import type { WorkspaceResolverPort } from "#/lib/arrange/application/ports/workspace-resolver.port";
import type {
  ArrangeFileProcessorService,
  ArrangeTargetScannerService,
} from "#/lib/arrange/contracts/services.contract";
import type { AnalyzeDirectoryUseCase } from "#/lib/arrange/application/use-cases/analyze-directory.use-case";
import type { RunArrangeSyncUseCase } from "#/lib/arrange/application/use-cases/run-arrange-sync.use-case";
import type { SuggestCnGroupsUseCase } from "#/lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import type { PrepareArrangeWorkspaceUseCase } from "#/lib/arrange/application/use-cases/prepare-arrange-workspace.use-case";
import type { TailwindGroupingService } from "#/lib/arrange/domain/tailwind-grouping.service";

export const FileWalkerPortToken = token<FileWalkerPort>("FileWalkerPort");
export const DomainSourceParserPortToken = token<DomainSourceParserPort>("DomainSourceParserPort");
export const GroupFilePreviewPortToken = token<GroupFilePreviewPort>("GroupFilePreviewPort");
export const ArrangeTargetScannerServiceToken = token<ArrangeTargetScannerService>(
  "ArrangeTargetScannerService",
);
export const ArrangeFileProcessorServiceToken = token<ArrangeFileProcessorService>(
  "ArrangeFileProcessorService",
);

export const AnalyzeDirectoryUseCaseToken =
  token<AnalyzeDirectoryUseCase>("AnalyzeDirectoryUseCase");
export const RunArrangeSyncUseCaseToken = token<RunArrangeSyncUseCase>("RunArrangeSyncUseCase");
export const SuggestCnGroupsUseCaseToken = token<SuggestCnGroupsUseCase>("SuggestCnGroupsUseCase");
export const PrepareArrangeWorkspaceUseCaseToken = token<PrepareArrangeWorkspaceUseCase>(
  "PrepareArrangeWorkspaceUseCase",
);
export const WorkspaceResolverPortToken = token<WorkspaceResolverPort>("WorkspaceResolverPort");
export const TailwindGroupingServiceToken =
  token<TailwindGroupingService>("TailwindGroupingService");
