import { Module } from "@codefast/di";
import { RunTagSyncUseCaseImpl } from "#/lib/tag/application/use-cases/run-tag-sync.use-case";
import { tagSinceWriterAdapter } from "#/lib/tag/infra/tag-since-writer.adapter";
import { tagTargetResolverAdapter } from "#/lib/tag/infra/tag-target-resolver.adapter";
import { tagTypeScriptTreeWalkAdapter } from "#/lib/tag/infra/typescript-tree-walk.adapter";
import { TagVersionResolverAdapter } from "#/lib/tag/infra/tag-version-resolver.adapter";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import { withOptionalPortTelemetry } from "#/lib/core/infra/logging-decorator.adapter";
import {
  CliLoggerToken,
  CliPathToken,
  RunTagSyncUseCaseToken,
  TagSinceWriterPortToken,
  TagTargetResolverPortToken,
  TagVersionResolverPortToken,
  TypeScriptTreeWalkPortToken,
} from "#/lib/tokens";

export const TagModule = Module.create("cli-tag", (api) => {
  api
    .bind(TagTargetResolverPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalPortTelemetry("TagTargetResolverPort", tagTargetResolverAdapter, logger),
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(TypeScriptTreeWalkPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalPortTelemetry("TypeScriptTreeWalkPort", tagTypeScriptTreeWalkAdapter, logger),
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(TagSinceWriterPortToken)
    .toResolved(
      (logger: CliLogger) =>
        withOptionalPortTelemetry("TagSinceWriterPort", tagSinceWriterAdapter, logger),
      [CliLoggerToken] as const,
    )
    .singleton();

  api
    .bind(TagVersionResolverPortToken)
    .toResolved(
      (path, logger) =>
        withOptionalPortTelemetry(
          "TagVersionResolverPort",
          new TagVersionResolverAdapter(path),
          logger,
        ),
      [CliPathToken, CliLoggerToken] as const,
    )
    .singleton();

  api.bind(RunTagSyncUseCaseToken).to(RunTagSyncUseCaseImpl).singleton();
});
