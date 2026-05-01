import { token } from "@codefast/di";
import type { ArrangeTargetPathResolverPort } from "#/domains/arrange/application/ports/outbound/arrange-target-path-resolver.port";
import type { DomainSourceParserPort } from "#/domains/arrange/application/ports/outbound/domain-source-parser.port";
import type { FileWalkerPort } from "#/domains/arrange/application/ports/outbound/file-walker.port";
import type { AnalyzeDirectoryUseCasePort } from "#/domains/arrange/application/ports/inbound/analyze-directory.use-case";
import type { PrepareArrangeWorkspaceUseCasePort } from "#/domains/arrange/application/ports/inbound/prepare-arrange-workspace.use-case";
import type { RunArrangeSyncUseCasePort } from "#/domains/arrange/application/ports/inbound/run-arrange-sync.use-case";
import type { SuggestCnGroupsUseCasePort } from "#/domains/arrange/application/ports/inbound/suggest-cn-groups.use-case";
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

export const AnalyzeDirectoryUseCaseToken =
  token<AnalyzeDirectoryUseCasePort>("AnalyzeDirectoryUseCase");
export const ArrangeTargetPathResolverPortToken = token<ArrangeTargetPathResolverPort>(
  "ArrangeTargetPathResolverPort",
);
export const RunArrangeSyncUseCaseToken = token<RunArrangeSyncUseCasePort>("RunArrangeSyncUseCase");
export const SuggestCnGroupsUseCaseToken =
  token<SuggestCnGroupsUseCasePort>("SuggestCnGroupsUseCase");
export const PrepareArrangeWorkspaceUseCaseToken = token<PrepareArrangeWorkspaceUseCasePort>(
  "PrepareArrangeWorkspaceUseCase",
);
export const TailwindGroupingServiceToken =
  token<TailwindGroupingService>("TailwindGroupingService");
