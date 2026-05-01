import { token } from "@codefast/di";
import type { ArrangeTargetPathResolverPort } from "#/domains/arrange/application/outbound/arrange-target-path-resolver.outbound-port";
import type { DomainSourceParserPort } from "#/domains/arrange/application/outbound/domain-source-parser.outbound-port";
import type { FileWalkerPort } from "#/domains/arrange/application/outbound/file-walker.outbound-port";
import type { GroupFilePreviewPort } from "#/domains/arrange/application/outbound/group-file-preview.outbound-port";
import type { AnalyzeDirectoryUseCase } from "#/domains/arrange/application/inbound/analyze-directory.use-case";
import type { PrepareArrangeWorkspaceUseCase } from "#/domains/arrange/application/inbound/prepare-arrange-workspace.use-case";
import type { RunArrangeSyncUseCase } from "#/domains/arrange/application/inbound/run-arrange-sync.use-case";
import type { SuggestCnGroupsUseCase } from "#/domains/arrange/application/inbound/suggest-cn-groups.use-case";
import type { PresentAnalyzeReportPresenter } from "#/domains/arrange/contracts/analyze-report-presenter.contract";
import type {
  ArrangeFileProcessorService,
  ArrangeTargetScannerService,
} from "#/domains/arrange/contracts/services.contract";
import type { TailwindGroupingService } from "#/domains/arrange/domain/tailwind-grouping.service";

export const FileWalkerPortToken = token<FileWalkerPort>("FileWalkerPort");
export const DomainSourceParserPortToken = token<DomainSourceParserPort>("DomainSourceParserPort");
export const GroupFilePreviewPortToken = token<GroupFilePreviewPort>("GroupFilePreviewPort");
export const PresentAnalyzeReportPresenterToken = token<PresentAnalyzeReportPresenter>(
  "PresentAnalyzeReportPresenter",
);
export const ArrangeTargetScannerServiceToken = token<ArrangeTargetScannerService>(
  "ArrangeTargetScannerService",
);
export const ArrangeFileProcessorServiceToken = token<ArrangeFileProcessorService>(
  "ArrangeFileProcessorService",
);

export const AnalyzeDirectoryUseCaseToken =
  token<AnalyzeDirectoryUseCase>("AnalyzeDirectoryUseCase");
export const ArrangeTargetPathResolverPortToken = token<ArrangeTargetPathResolverPort>(
  "ArrangeTargetPathResolverPort",
);
export const RunArrangeSyncUseCaseToken = token<RunArrangeSyncUseCase>("RunArrangeSyncUseCase");
export const SuggestCnGroupsUseCaseToken = token<SuggestCnGroupsUseCase>("SuggestCnGroupsUseCase");
export const PrepareArrangeWorkspaceUseCaseToken = token<PrepareArrangeWorkspaceUseCase>(
  "PrepareArrangeWorkspaceUseCase",
);
export const TailwindGroupingServiceToken =
  token<TailwindGroupingService>("TailwindGroupingService");
