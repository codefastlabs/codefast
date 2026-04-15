import { Module } from "@codefast/di";
import { analyzeDirectory } from "#lib/arrange/application/use-cases/analyze-directory.use-case";
import { runArrangeSync } from "#lib/arrange/application/use-cases/run-arrange-sync.use-case";
import { suggestCnGroupsForCli } from "#lib/arrange/application/use-cases/suggest-cn-groups.use-case";
import { DomainSourceParserAdapter } from "#lib/arrange/infra/domain-source-parser.adapter";
import { FileWalkerAdapter } from "#lib/arrange/infra/file-walker.adapter";
import { groupFilePreviewPresenter } from "#lib/arrange/presentation/group-file-preview.presenter";
import type { CliLogger } from "#lib/core/application/ports/cli-io.port";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#lib/core/infra/logging-decorator.adapter";
import {
  AnalyzeDirectoryUseCaseToken,
  CliFsToken,
  CliLoggerToken,
  CliPathToken,
  DomainSourceParserPortToken,
  FileWalkerPortToken,
  GroupFilePreviewPortToken,
  RunArrangeSyncUseCaseToken,
  SuggestCnGroupsUseCaseToken,
} from "#lib/tokens";

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
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(DomainSourceParserPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry(
          "DomainSourceParserPort",
          new DomainSourceParserAdapter(logger),
          logger,
        ),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(GroupFilePreviewPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("GroupFilePreviewPort", groupFilePreviewPresenter, logger),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(AnalyzeDirectoryUseCaseToken)
    .toResolved(
      (fs, fileWalker, domainSourceParser) => (request) =>
        analyzeDirectory(request, { fs, fileWalker, domainSourceParser }),
      [CliFsToken, FileWalkerPortToken, DomainSourceParserPortToken],
    )
    .singleton()
    .build();

  api
    .bind(RunArrangeSyncUseCaseToken)
    .toResolved(
      (fs, logger, path, fileWalker, domainSourceParser, groupFilePreview) => (request) =>
        runArrangeSync(request, {
          fs,
          logger,
          path,
          fileWalker,
          domainSourceParser,
          groupFilePreview,
        }),
      [
        CliFsToken,
        CliLoggerToken,
        CliPathToken,
        FileWalkerPortToken,
        DomainSourceParserPortToken,
        GroupFilePreviewPortToken,
      ],
    )
    .singleton()
    .build();

  api
    .bind(SuggestCnGroupsUseCaseToken)
    .toDynamic(() => suggestCnGroupsForCli)
    .singleton()
    .build();
});
