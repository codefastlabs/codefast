import { Module } from "@codefast/di";
import { ArrangeFileProcessorServiceImpl } from "#/lib/arrange/application/services/arrange-file-processor.service";
import { ArrangeTargetScannerServiceImpl } from "#/lib/arrange/application/services/arrange-target-scanner.service";
import { AnalyzeDirectoryUseCaseImpl } from "#/lib/arrange/application/use-cases/analyze-directory.use-case";
import { RunArrangeSyncUseCaseImpl } from "#/lib/arrange/application/use-cases/run-arrange-sync.use-case";
import { SuggestCnGroupsUseCaseImpl } from "#/lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import { DomainSourceParserAdapter } from "#/lib/arrange/adapters/secondary/domain-source-parser.adapter";
import { FileWalkerAdapter } from "#/lib/arrange/adapters/secondary/file-walker.adapter";
import { WorkspaceResolverAdapter } from "#/lib/arrange/adapters/secondary/workspace-resolver.adapter";
import { TailwindGroupingServiceImpl } from "#/lib/arrange/domain/tailwind-grouping.service";
import {
  AnalyzeDirectoryUseCaseToken,
  ArrangeFileProcessorServiceToken,
  ArrangeTargetScannerServiceToken,
  DomainSourceParserPortToken,
  FileWalkerPortToken,
  PrepareArrangeWorkspaceUseCaseToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
  TailwindGroupingServiceToken,
  WorkspaceResolverPortToken,
} from "#/lib/arrange/contracts/tokens";
import { PrepareArrangeWorkspaceUseCaseImpl } from "#/lib/arrange/application/use-cases/prepare-arrange-workspace.use-case";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import { InfrastructureModule } from "#/lib/core/infrastructure/infrastructure.module";
import { withOptionalPortTelemetry } from "#/lib/core/infrastructure/port-telemetry.decorator";

export const ArrangeModule = Module.create("cli-arrange", (moduleBuilder) => {
  moduleBuilder.import(InfrastructureModule);

  moduleBuilder
    .bind(FileWalkerPortToken)
    .to(FileWalkerAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry("FileWalkerPort", implementation, ctx.resolve(CliLoggerToken)),
    )
    .singleton();

  moduleBuilder
    .bind(DomainSourceParserPortToken)
    .to(DomainSourceParserAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "DomainSourceParserPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  moduleBuilder.bind(WorkspaceResolverPortToken).to(WorkspaceResolverAdapter).singleton();

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
});
