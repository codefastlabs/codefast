import { Module } from "@codefast/di";
import { ArrangeFileProcessorAdapter } from "#/domains/arrange/infrastructure/adapters/arrange-file-processor.adapter";
import { ArrangeTargetPathResolverAdapter } from "#/domains/arrange/infrastructure/adapters/arrange-target-path-resolver.adapter";
import { ArrangeTargetScannerAdapter } from "#/domains/arrange/infrastructure/adapters/arrange-target-scanner.adapter";
import { AnalyzeDirectoryUseCase } from "#/domains/arrange/application/use-cases/analyze-directory.use-case";
import { PrepareArrangeWorkspaceUseCase } from "#/domains/arrange/application/use-cases/prepare-arrange-workspace.use-case";
import { RunArrangeSyncUseCase } from "#/domains/arrange/application/use-cases/run-arrange-sync.use-case";
import { SuggestCnGroupsUseCase } from "#/domains/arrange/application/use-cases/suggest-cn-groups.use-case";
import { DomainSourceParserAdapter } from "#/domains/arrange/infrastructure/adapters/domain-source-parser.adapter";
import { TypeScriptAstTranslator } from "#/domains/arrange/infrastructure/typescript-ast-translator";
import { FileWalkerAdapter } from "#/domains/arrange/infrastructure/adapters/file-walker.adapter";
import {
  AnalyzeDirectoryUseCaseToken,
  ArrangeFileProcessorPortToken,
  ArrangeTargetPathResolverPortToken,
  ArrangeTargetScannerPortToken,
  DomainSourceParserPortToken,
  FileWalkerPortToken,
  PresentGroupFilePreviewPresenterToken,
  PresentAnalyzeReportPresenterToken,
  PresentArrangeSyncResultPresenterToken,
  PrepareArrangeWorkspaceUseCaseToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
  TailwindGroupingServiceToken,
} from "#/domains/arrange/composition/tokens";
import { TailwindGroupingDomainService } from "#/domains/arrange/domain/tailwind-grouping.domain-service";
import { PresentAnalyzeReportPresenter } from "#/domains/arrange/presentation/presenters/arrange-analyze.presenter";
import { PresentGroupFilePreviewPresenter } from "#/domains/arrange/presentation/presenters/group-file-preview.presenter";
import { PresentArrangeSyncResultPresenter } from "#/domains/arrange/presentation/presenters/arrange-sync.presenter";
import { ShellInfrastructureModule } from "#/shell/shell.module";
import { createOptionalCliPortTelemetryActivation } from "#/shell/wiring/optional-cli-port-telemetry-activation";

export const ArrangeModule = Module.create("cli-arrange", (moduleBuilder) => {
  moduleBuilder.import(ShellInfrastructureModule);

  moduleBuilder
    .bind(FileWalkerPortToken)
    .to(FileWalkerAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(FileWalkerPortToken));

  moduleBuilder
    .bind(TypeScriptAstTranslator)
    .toSelf()
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(TypeScriptAstTranslator));

  moduleBuilder
    .bind(DomainSourceParserPortToken)
    .to(DomainSourceParserAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(DomainSourceParserPortToken));

  moduleBuilder
    .bind(ArrangeTargetPathResolverPortToken)
    .to(ArrangeTargetPathResolverAdapter)
    .singleton();

  moduleBuilder.bind(TailwindGroupingServiceToken).to(TailwindGroupingDomainService).singleton();

  moduleBuilder.bind(AnalyzeDirectoryUseCaseToken).to(AnalyzeDirectoryUseCase).singleton();

  moduleBuilder.bind(ArrangeTargetScannerPortToken).to(ArrangeTargetScannerAdapter).singleton();

  moduleBuilder.bind(ArrangeFileProcessorPortToken).to(ArrangeFileProcessorAdapter).singleton();

  moduleBuilder.bind(RunArrangeSyncUseCaseToken).to(RunArrangeSyncUseCase).singleton();

  moduleBuilder.bind(SuggestCnGroupsUseCaseToken).to(SuggestCnGroupsUseCase).singleton();

  moduleBuilder
    .bind(PrepareArrangeWorkspaceUseCaseToken)
    .to(PrepareArrangeWorkspaceUseCase)
    .singleton();

  moduleBuilder
    .bind(PresentAnalyzeReportPresenterToken)
    .to(PresentAnalyzeReportPresenter)
    .singleton();

  moduleBuilder
    .bind(PresentGroupFilePreviewPresenterToken)
    .to(PresentGroupFilePreviewPresenter)
    .singleton();

  moduleBuilder
    .bind(PresentArrangeSyncResultPresenterToken)
    .to(PresentArrangeSyncResultPresenter)
    .singleton();
});
