import { token } from "@codefast/di";
import type { ArrangeTargetPathResolverPort } from "#/domains/arrange/application/ports/outbound/arrange-target-path-resolver.port";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/outbound/domain-source-parser.port";
import type { FileWalkerPort } from "#/domains/arrange/application/ports/outbound/file-walker.port";
import type { GroupFilePreviewPort } from "#/domains/arrange/application/ports/outbound/group-file-preview.port";
import type { AnalyzeDirectoryUseCase } from "#/domains/arrange/application/ports/inbound/analyze-directory.port";
import type { PrepareArrangeWorkspaceUseCase } from "#/domains/arrange/application/ports/inbound/prepare-arrange-workspace.port";
import type { RunArrangeSyncUseCase } from "#/domains/arrange/application/ports/inbound/run-arrange-sync.port";
import type { SuggestCnGroupsUseCase } from "#/domains/arrange/application/ports/inbound/suggest-cn-groups.port";
import type { PresentAnalyzeReportPresenter } from "#/domains/arrange/application/ports/presenting/present-analyze-report.port";
import type { ArrangeFileProcessorPort } from "#/domains/arrange/application/ports/outbound/arrange-file-processor.port";
import type { ArrangeTargetScannerPort } from "#/domains/arrange/application/ports/outbound/arrange-target-scanner.port";
import type { TailwindGroupingService } from "#/domains/arrange/domain/tailwind-grouping.service";

export const FileWalkerPortToken = token<FileWalkerPort>("FileWalkerPort");
export const DomainSourceParserPortToken = token<DomainSourceParserPort>("DomainSourceParserPort");
export const GroupFilePreviewPortToken = token<GroupFilePreviewPort>("GroupFilePreviewPort");
export const PresentAnalyzeReportPresenterToken = token<PresentAnalyzeReportPresenter>(
  "PresentAnalyzeReportPresenter",
);
export const ArrangeTargetScannerPortToken = token<ArrangeTargetScannerPort>(
  "ArrangeTargetScannerPort",
);
export const ArrangeFileProcessorPortToken = token<ArrangeFileProcessorPort>(
  "ArrangeFileProcessorPort",
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
