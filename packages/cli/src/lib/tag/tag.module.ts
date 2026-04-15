import { Module } from "@codefast/di";
import { runTagSync } from "#lib/tag/application/use-cases/run-tag-sync.use-case";
import { tagSinceWriterAdapter } from "#lib/tag/infra/tag-since-writer.adapter";
import { tagTargetResolverAdapter } from "#lib/tag/infra/tag-target-resolver.adapter";
import { tagTypeScriptTreeWalkAdapter } from "#lib/tag/infra/typescript-tree-walk.adapter";
import { TagVersionResolverAdapter } from "#lib/tag/infra/tag-version-resolver.adapter";
import type { CliLogger } from "#lib/core/application/ports/cli-io.port";
import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
} from "#lib/core/infra/logging-decorator.adapter";
import {
  CliFsToken,
  CliLoggerToken,
  CliPathToken,
  RunTagSyncUseCaseToken,
  TagSinceWriterPortToken,
  TagTargetResolverPortToken,
  TagVersionResolverPortToken,
  TypeScriptTreeWalkPortToken,
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

export const TagModule = Module.create("cli-tag", (api) => {
  api
    .bind(TagTargetResolverPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("TagTargetResolverPort", tagTargetResolverAdapter, logger),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(TypeScriptTreeWalkPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("TypeScriptTreeWalkPort", tagTypeScriptTreeWalkAdapter, logger),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(TagSinceWriterPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalTelemetry("TagSinceWriterPort", tagSinceWriterAdapter, logger),
      [CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(TagVersionResolverPortToken)
    .toResolved(
      (path, logger) =>
        withOptionalTelemetry(
          "TagVersionResolverPort",
          new TagVersionResolverAdapter(path),
          logger,
        ),
      [CliPathToken, CliLoggerToken],
    )
    .singleton()
    .build();

  api
    .bind(RunTagSyncUseCaseToken)
    .toResolved(
      (fs, path, targetResolver, typeScriptTreeWalk, versionResolver, sinceWriter) => (input) =>
        runTagSync(input, {
          fs,
          path,
          targetResolver,
          typeScriptTreeWalk,
          versionResolver,
          sinceWriter,
        }),
      [
        CliFsToken,
        CliPathToken,
        TagTargetResolverPortToken,
        TypeScriptTreeWalkPortToken,
        TagVersionResolverPortToken,
        TagSinceWriterPortToken,
      ],
    )
    .singleton()
    .build();
});
