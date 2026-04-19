import { Module } from "@codefast/di";
import { ArrangeFileProcessorServiceImpl } from "#/lib/arrange/application/services/arrange-file-processor.service";
import { ArrangeTargetScannerServiceImpl } from "#/lib/arrange/application/services/arrange-target-scanner.service";
import { AnalyzeDirectoryUseCaseImpl } from "#/lib/arrange/application/use-cases/analyze-directory.use-case";
import { RunArrangeSyncUseCaseImpl } from "#/lib/arrange/application/use-cases/run-arrange-sync.use-case";
import { SuggestCnGroupsUseCaseImpl } from "#/lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import { DomainSourceParserAdapter } from "#/lib/arrange/infra/domain-source-parser.adapter";
import { FileWalkerAdapter } from "#/lib/arrange/infra/file-walker.adapter";
import { GroupFilePreviewPresenterAdapter } from "#/lib/arrange/presentation/group-file-preview.presenter";
import { withOptionalPortTelemetry } from "#/lib/core/infra/logging-decorator.adapter";
import {
  AnalyzeDirectoryUseCaseToken,
  ArrangeFileProcessorToken,
  ArrangeTargetScannerToken,
  CliLoggerToken,
  DomainSourceParserPortToken,
  FileWalkerPortToken,
  GroupFilePreviewPortToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
} from "#/lib/tokens";

export const ArrangeModule = Module.create("cli-arrange", (api) => {
  api
    .bind(FileWalkerPortToken)
    .to(FileWalkerAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry("FileWalkerPort", implementation, ctx.resolve(CliLoggerToken)),
    )
    .singleton();

  api
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

  api
    .bind(GroupFilePreviewPortToken)
    .to(GroupFilePreviewPresenterAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "GroupFilePreviewPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  api.bind(AnalyzeDirectoryUseCaseToken).to(AnalyzeDirectoryUseCaseImpl).singleton();

  api.bind(ArrangeTargetScannerToken).to(ArrangeTargetScannerServiceImpl).singleton();

  api.bind(ArrangeFileProcessorToken).to(ArrangeFileProcessorServiceImpl).singleton();

  api.bind(RunArrangeSyncUseCaseToken).to(RunArrangeSyncUseCaseImpl).singleton();

  api.bind(SuggestCnGroupsUseCaseToken).to(SuggestCnGroupsUseCaseImpl).singleton();
});
