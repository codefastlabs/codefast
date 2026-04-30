import { Module } from "@codefast/di";
import { TagSinceWriterAdapter } from "#/lib/tag/adapters/secondary/tag-since-writer.adapter";
import { TagTargetResolverAdapter } from "#/lib/tag/adapters/secondary/tag-target-resolver.adapter";
import { TagVersionResolverAdapter } from "#/lib/tag/adapters/secondary/tag-version-resolver.adapter";
import { TypeScriptTreeWalkAdapter } from "#/lib/tag/adapters/secondary/typescript-tree-walk.adapter";
import { TagCliTargetPathResolverServiceImpl } from "#/lib/tag/application/services/tag-cli-target-path-resolver.service";
import { TagTargetRunnerServiceImpl } from "#/lib/tag/application/services/tag-target-runner.service";
import { PrepareTagSyncUseCaseImpl } from "#/lib/tag/application/use-cases/prepare-tag-sync.use-case";
import { RunTagSyncUseCaseImpl } from "#/lib/tag/application/use-cases/run-tag-sync.use-case";
import {
  PrepareTagSyncUseCaseToken,
  PresentTagSyncResultPresenterToken,
  RunTagSyncUseCaseToken,
  TagCliTargetPathResolverServiceToken,
  TagSinceWriterPortToken,
  TagSyncProgressListenerToken,
  TagTargetResolverPortToken,
  TagTargetRunnerServiceToken,
  TagVersionResolverPortToken,
  TypeScriptTreeWalkPortToken,
} from "#/lib/tag/contracts/tokens";
import { PresentTagSyncResultPresenterImpl } from "#/lib/tag/presentation/present-tag-sync-result.presenter";
import { TagSyncProgressListener } from "#/lib/tag/presentation/tag-sync-progress-listener.presenter";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";
import { InfrastructureModule } from "#/lib/core/core.module";
import { withOptionalPortTelemetry } from "#/lib/core/infrastructure/port-telemetry.decorator";

export const TagModule = Module.create("cli-tag", (moduleBuilder) => {
  moduleBuilder.import(InfrastructureModule);

  moduleBuilder
    .bind(TagTargetResolverPortToken)
    .to(TagTargetResolverAdapter)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TagTargetResolverPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder
    .bind(TypeScriptTreeWalkPortToken)
    .to(TypeScriptTreeWalkAdapter)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TypeScriptTreeWalkPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder
    .bind(TagSinceWriterPortToken)
    .to(TagSinceWriterAdapter)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry("TagSinceWriterPort", implementation, ctx.resolve(CliLoggerToken)),
    );

  moduleBuilder
    .bind(TagVersionResolverPortToken)
    .to(TagVersionResolverAdapter)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TagVersionResolverPort",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder
    .bind(TagTargetRunnerServiceToken)
    .to(TagTargetRunnerServiceImpl)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TagTargetRunnerService",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder
    .bind(TagCliTargetPathResolverServiceToken)
    .to(TagCliTargetPathResolverServiceImpl)
    .singleton()
    .onActivation((ctx, implementation) =>
      withOptionalPortTelemetry(
        "TagCliTargetPathResolverService",
        implementation,
        ctx.resolve(CliLoggerToken),
      ),
    );

  moduleBuilder.bind(PrepareTagSyncUseCaseToken).to(PrepareTagSyncUseCaseImpl).singleton();
  moduleBuilder.bind(RunTagSyncUseCaseToken).to(RunTagSyncUseCaseImpl).singleton();

  moduleBuilder
    .bind(PresentTagSyncResultPresenterToken)
    .to(PresentTagSyncResultPresenterImpl)
    .singleton();
  moduleBuilder.bind(TagSyncProgressListenerToken).to(TagSyncProgressListener).singleton();
});
