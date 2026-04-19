import { Module } from "@codefast/di";
import { RunTagSyncUseCaseImpl } from "#/lib/tag/application/use-cases/run-tag-sync.use-case";
import { TagSinceWriterAdapter } from "#/lib/tag/infra/tag-since-writer.adapter";
import { TagTargetResolverAdapter } from "#/lib/tag/infra/tag-target-resolver.adapter";
import { TypeScriptTreeWalkAdapter } from "#/lib/tag/infra/typescript-tree-walk.adapter";
import { TagVersionResolverAdapter } from "#/lib/tag/infra/tag-version-resolver.adapter";
import { InfraModule } from "#/lib/core/infra/infra.module";
import { withOptionalPortTelemetry } from "#/lib/core/infra/logging-decorator.adapter";
import {
  CliLoggerToken,
  RunTagSyncUseCaseToken,
  TagSinceWriterPortToken,
  TagTargetResolverPortToken,
  TagVersionResolverPortToken,
  TypeScriptTreeWalkPortToken,
} from "#/lib/tokens";

export const TagModule = Module.create("cli-tag", (moduleBuilder) => {
  moduleBuilder.import(InfraModule);

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

  moduleBuilder.bind(RunTagSyncUseCaseToken).to(RunTagSyncUseCaseImpl).singleton();
});
