import { Module } from "@codefast/di";
import { ArrangeFileProcessorServiceImpl } from "#/domains/arrange/application/services/arrange-file-processor.service";
import { ArrangeTargetPathResolver } from "#/domains/arrange/application/services/arrange-target-path-resolver.service";
import { ArrangeTargetScannerServiceImpl } from "#/domains/arrange/application/services/arrange-target-scanner.service";
import { AnalyzeDirectoryUseCaseImpl } from "#/domains/arrange/application/use-cases/analyze-directory.use-case";
import { PrepareArrangeWorkspaceUseCaseImpl } from "#/domains/arrange/application/use-cases/prepare-arrange-workspace.use-case";
import { RunArrangeSyncUseCaseImpl } from "#/domains/arrange/application/use-cases/run-arrange-sync.use-case";
import { SuggestCnGroupsUseCaseImpl } from "#/domains/arrange/application/use-cases/suggest-cn-groups.use-case";
import { DomainSourceParserAdapter } from "#/domains/arrange/infrastructure/adapters/domain-source-parser.adapter";
import { TypeScriptAstTranslator } from "#/domains/arrange/infrastructure/adapters/typescript-ast-translator.adapter";
import { FileWalkerAdapter } from "#/domains/arrange/infrastructure/adapters/file-walker.adapter";
import {
  AnalyzeDirectoryUseCaseToken,
  ArrangeFileProcessorServiceToken,
  ArrangeTargetPathResolverPortToken,
  ArrangeTargetScannerServiceToken,
  DomainSourceParserPortToken,
  FileWalkerPortToken,
  GroupFilePreviewPortToken,
  PresentAnalyzeReportPresenterToken,
  PrepareArrangeWorkspaceUseCaseToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
  TailwindGroupingServiceToken,
} from "#/domains/arrange/contracts/tokens";
import { TailwindGroupingServiceImpl } from "#/domains/arrange/domain/tailwind-grouping.service";
import { PresentAnalyzeReportPresenterImpl } from "#/domains/arrange/presentation/presenters/arrange-analyze.presenter";
import { GroupFilePreviewPresenterAdapter } from "#/domains/arrange/presentation/presenters/group-file-preview.presenter";
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

  moduleBuilder.bind(ArrangeTargetPathResolverPortToken).to(ArrangeTargetPathResolver).singleton();

  moduleBuilder.bind(TailwindGroupingServiceToken).to(TailwindGroupingServiceImpl).singleton();

  moduleBuilder.bind(AnalyzeDirectoryUseCaseToken).to(AnalyzeDirectoryUseCaseImpl).singleton();

  moduleBuilder
    .bind(ArrangeTargetScannerServiceToken)
    .to(ArrangeTargetScannerServiceImpl)
    .singleton();

  moduleBuilder
    .bind(ArrangeFileProcessorServiceToken)
    .to(ArrangeFileProcessorServiceImpl)
    .singleton();

  moduleBuilder.bind(RunArrangeSyncUseCaseToken).to(RunArrangeSyncUseCaseImpl).singleton();

  moduleBuilder.bind(SuggestCnGroupsUseCaseToken).to(SuggestCnGroupsUseCaseImpl).singleton();

  moduleBuilder
    .bind(PrepareArrangeWorkspaceUseCaseToken)
    .to(PrepareArrangeWorkspaceUseCaseImpl)
    .singleton();

  moduleBuilder
    .bind(PresentAnalyzeReportPresenterToken)
    .to(PresentAnalyzeReportPresenterImpl)
    .singleton();

  moduleBuilder.bind(GroupFilePreviewPortToken).to(GroupFilePreviewPresenterAdapter).singleton();
});
