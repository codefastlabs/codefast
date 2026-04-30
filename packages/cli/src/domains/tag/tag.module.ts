import { Module } from "@codefast/di";
import { TagSinceWriterAdapter } from "#/domains/tag/infrastructure/adapters/tag-since-writer.adapter";
import { TagTargetResolverAdapter } from "#/domains/tag/infrastructure/adapters/tag-target-resolver.adapter";
import { TagVersionResolverAdapter } from "#/domains/tag/infrastructure/adapters/tag-version-resolver.adapter";
import { TagCliTargetPathResolverServiceImpl } from "#/domains/tag/application/services/tag-cli-target-path-resolver.service";
import { TagTargetRunnerServiceImpl } from "#/domains/tag/application/services/tag-target-runner.service";
import { PrepareTagSyncUseCaseImpl } from "#/domains/tag/application/use-cases/prepare-tag-sync.use-case";
import { RunTagSyncUseCaseImpl } from "#/domains/tag/application/use-cases/run-tag-sync.use-case";
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
} from "#/domains/tag/contracts/tokens";
import { PresentTagSyncResultPresenterImpl } from "#/domains/tag/presentation/presenters/present-tag-sync-result.presenter";
import { TagSyncProgressListener } from "#/domains/tag/presentation/presenters/tag-sync-progress-listener.presenter";
import { CliLoggerToken } from "#/shell/application/cli-runtime.tokens";
import { ShellInfrastructureModule } from "#/shell/shell.module";
import { withOptionalPortTelemetry } from "#/shell/infrastructure/port-telemetry.decorator";

export const TagModule = Module.create("cli-tag", (moduleBuilder) => {
  moduleBuilder.import(ShellInfrastructureModule);

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
