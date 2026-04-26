import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import type { FileWalkerPort } from "#/lib/arrange/application/ports/file-walker.port";
import type { GroupFilePreviewPort } from "#/lib/arrange/application/ports/group-file-preview.port";
import type { PresentAnalyzeReportPresenter } from "#/lib/arrange/contracts/presentation.contract";
import type { PrepareArrangeWorkspaceUseCase } from "#/lib/arrange/application/use-cases/prepare-arrange-workspace.use-case";
import type {
  ArrangeFileProcessorService,
  ArrangeTargetScannerService,
} from "#/lib/arrange/contracts/services.contract";
import type {
  AnalyzeDirectoryUseCase,
  RunArrangeSyncUseCase,
  SuggestCnGroupsUseCase,
} from "#/lib/arrange/contracts/use-cases.contract";
export const FileWalkerPortToken: Token<FileWalkerPort> = token<FileWalkerPort>("FileWalkerPort");
export const DomainSourceParserPortToken: Token<DomainSourceParserPort> =
  token<DomainSourceParserPort>("DomainSourceParserPort");
export const GroupFilePreviewPortToken: Token<GroupFilePreviewPort> =
  token<GroupFilePreviewPort>("GroupFilePreviewPort");
export const ArrangeTargetScannerToken: Token<ArrangeTargetScannerService> =
  token<ArrangeTargetScannerService>("ArrangeTargetScannerService");
export const ArrangeFileProcessorToken: Token<ArrangeFileProcessorService> =
  token<ArrangeFileProcessorService>("ArrangeFileProcessorService");

export const AnalyzeDirectoryUseCaseToken: Token<AnalyzeDirectoryUseCase> =
  token<AnalyzeDirectoryUseCase>("AnalyzeDirectoryUseCase");
export const RunArrangeSyncUseCaseToken: Token<RunArrangeSyncUseCase> =
  token<RunArrangeSyncUseCase>("RunArrangeSyncUseCase");
export const SuggestCnGroupsUseCaseToken: Token<SuggestCnGroupsUseCase> =
  token<SuggestCnGroupsUseCase>("SuggestCnGroupsUseCase");
export const PrepareArrangeWorkspaceUseCaseToken: Token<PrepareArrangeWorkspaceUseCase> =
  token<PrepareArrangeWorkspaceUseCase>("PrepareArrangeWorkspaceUseCase");
export const PresentAnalyzeReportPresenterToken: Token<PresentAnalyzeReportPresenter> =
  token<PresentAnalyzeReportPresenter>("PresentAnalyzeReportPresenter");
