import { token } from "@codefast/di";
import type { ArrangeTargetPathResolverPort } from "#/domains/arrange/application/ports/outbound/arrange-target-path-resolver.port";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/outbound/domain-source-parser.port";
import type { FileWalkerPort } from "#/domains/arrange/application/ports/outbound/file-walker.port";
import type { AnalyzeDirectoryPort } from "#/domains/arrange/application/ports/inbound/analyze-directory.port";
import type { PrepareArrangeWorkspacePort } from "#/domains/arrange/application/ports/inbound/prepare-arrange-workspace.port";
import type { RunArrangeSyncPort } from "#/domains/arrange/application/ports/inbound/run-arrange-sync.port";
import type { SuggestCnGroupsPort } from "#/domains/arrange/application/ports/inbound/suggest-cn-groups.port";
import type { PresentAnalyzeReportPresenter } from "#/domains/arrange/application/ports/presenting/present-analyze-report.presenter";
import type { PresentGroupFilePreviewPresenter } from "#/domains/arrange/application/ports/presenting/present-group-file-preview.presenter";
import type { PresentArrangeSyncResultPresenter } from "#/domains/arrange/application/ports/presenting/present-arrange-sync-result.presenter";
import type { ArrangeFileProcessorPort } from "#/domains/arrange/application/ports/outbound/arrange-file-processor.port";
import type { ArrangeTargetScannerPort } from "#/domains/arrange/application/ports/outbound/arrange-target-scanner.port";
import type { TailwindGroupingService } from "#/domains/arrange/domain/tailwind-grouping.domain-service";

export const FileWalkerPortToken = token<FileWalkerPort>("FileWalkerPort");
export const DomainSourceParserPortToken = token<DomainSourceParserPort>("DomainSourceParserPort");
export const PresentGroupFilePreviewPresenterToken = token<PresentGroupFilePreviewPresenter>(
  "PresentGroupFilePreviewPresenter",
);
export const PresentAnalyzeReportPresenterToken = token<PresentAnalyzeReportPresenter>(
  "PresentAnalyzeReportPresenter",
);
export const PresentArrangeSyncResultPresenterToken = token<PresentArrangeSyncResultPresenter>(
  "PresentArrangeSyncResultPresenter",
);
export const ArrangeTargetScannerPortToken = token<ArrangeTargetScannerPort>(
  "ArrangeTargetScannerPort",
);
export const ArrangeFileProcessorPortToken = token<ArrangeFileProcessorPort>(
  "ArrangeFileProcessorPort",
);

export const AnalyzeDirectoryUseCaseToken = token<AnalyzeDirectoryPort>("AnalyzeDirectoryUseCase");
export const ArrangeTargetPathResolverPortToken = token<ArrangeTargetPathResolverPort>(
  "ArrangeTargetPathResolverPort",
);
export const RunArrangeSyncUseCaseToken = token<RunArrangeSyncPort>("RunArrangeSyncUseCase");
export const SuggestCnGroupsUseCaseToken = token<SuggestCnGroupsPort>("SuggestCnGroupsUseCase");
export const PrepareArrangeWorkspaceUseCaseToken = token<PrepareArrangeWorkspacePort>(
  "PrepareArrangeWorkspaceUseCase",
);
export const TailwindGroupingServiceToken =
  token<TailwindGroupingService>("TailwindGroupingService");
