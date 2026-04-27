import { Module } from "@codefast/di";
import { RunTagSyncUseCaseImpl } from "#/lib/tag/application/use-cases/run-tag-sync.use-case";
import { PrepareTagSyncUseCaseImpl } from "#/lib/tag/application/use-cases/prepare-tag-sync.use-case";
import { TagSinceWriterAdapter } from "#/lib/tag/infrastructure/tag-since-writer.adapter";
import { TagTargetResolverAdapter } from "#/lib/tag/infrastructure/tag-target-resolver.adapter";
import { TypeScriptTreeWalkAdapter } from "#/lib/tag/infrastructure/typescript-tree-walk.adapter";
import { TagVersionResolverAdapter } from "#/lib/tag/infrastructure/tag-version-resolver.adapter";
import {
  PrepareTagSyncUseCaseToken,
  RunTagSyncUseCaseToken,
  TagSinceWriterPortToken,
  TagTargetResolverPortToken,
  TagVersionResolverPortToken,
  TypeScriptTreeWalkPortToken,
} from "#/lib/tag/contracts/tokens";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import { InfrastructureModule } from "#/lib/core/infrastructure/infrastructure.module";
import { withOptionalPortTelemetry } from "#/lib/core/infrastructure/logging-decorator.adapter";

export const TagModule = Module.create("cli-tag", (moduleBuilder) => {
  moduleBuilder.import(InfrastructureModule);

  moduleBuilder
    .bind(TagTargetResolverPortToken)
    .to(TagTargetResolverAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TagTargetResolverPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  moduleBuilder
    .bind(TypeScriptTreeWalkPortToken)
    .to(TypeScriptTreeWalkAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TypeScriptTreeWalkPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  moduleBuilder
    .bind(TagSinceWriterPortToken)
    .to(TagSinceWriterAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry("TagSinceWriterPort", implementation, ctx.resolve(CliLoggerToken)),
    )
    .singleton();

  moduleBuilder
    .bind(TagVersionResolverPortToken)
    .to(TagVersionResolverAdapter)
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TagVersionResolverPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    )
    .singleton();

  moduleBuilder.bind(PrepareTagSyncUseCaseToken).to(PrepareTagSyncUseCaseImpl).singleton();
  moduleBuilder.bind(RunTagSyncUseCaseToken).to(RunTagSyncUseCaseImpl).singleton();
});
