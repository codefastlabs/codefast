import { Module } from "@codefast/di";
import { ArrangeFileProcessorServiceImpl } from "#/lib/arrange/application/services/arrange-file-processor.service";
import { ArrangeTargetScannerServiceImpl } from "#/lib/arrange/application/services/arrange-target-scanner.service";
import { AnalyzeDirectoryUseCaseImpl } from "#/lib/arrange/application/use-cases/analyze-directory.use-case";
import { RunArrangeSyncUseCaseImpl } from "#/lib/arrange/application/use-cases/run-arrange-sync.use-case";
import { SuggestCnGroupsUseCaseImpl } from "#/lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import { DomainSourceParserAdapter } from "#/lib/arrange/infra/domain-source-parser.adapter";
import { FileWalkerAdapter } from "#/lib/arrange/infra/file-walker.adapter";
import { groupFilePreviewPresenter } from "#/lib/arrange/presentation/group-file-preview.presenter";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#/lib/core/infra/logging-decorator.adapter";
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

function withOptionalTelemetry<T extends object>(
  portName: string,
  implementation: T,
  logger: CliLogger,
): T {
  if (!isCliTelemetryEnabled()) {
    return implementation;
  }
  return withCliPortTelemetry({ portName, implementation, logger });
}

export const ArrangeModule = Module.create("cli-arrange", (api) => {
  api
    .bind(FileWalkerPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("FileWalkerPort", new FileWalkerAdapter(logger), logger),
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(DomainSourceParserPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry(
          "DomainSourceParserPort",
          new DomainSourceParserAdapter(logger),
          logger,
        ),
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(GroupFilePreviewPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("GroupFilePreviewPort", groupFilePreviewPresenter, logger),
      [CliLoggerToken] as const,
    )
    .singleton();

  api.bind(AnalyzeDirectoryUseCaseToken).to(AnalyzeDirectoryUseCaseImpl).singleton();

  api.bind(ArrangeTargetScannerToken).to(ArrangeTargetScannerServiceImpl).singleton();

  api.bind(ArrangeFileProcessorToken).to(ArrangeFileProcessorServiceImpl).singleton();

  api.bind(RunArrangeSyncUseCaseToken).to(RunArrangeSyncUseCaseImpl).singleton();

  api.bind(SuggestCnGroupsUseCaseToken).to(SuggestCnGroupsUseCaseImpl).singleton();
});
