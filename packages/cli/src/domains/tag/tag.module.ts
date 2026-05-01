import { Module } from "@codefast/di";
import { TagTargetResolverAdapter } from "#/domains/tag/infrastructure/adapters/tag-target-resolver.adapter";
import { TagSinceWriterAdapter } from "#/domains/tag/infrastructure/adapters/tag-since-writer.adapter";
import { TagVersionResolverAdapter } from "#/domains/tag/infrastructure/adapters/tag-version-resolver.adapter";
import { TagTargetPathResolverAdapter } from "#/domains/tag/infrastructure/adapters/tag-target-path-resolver.adapter";
import { TagTargetRunnerAdapter } from "#/domains/tag/infrastructure/adapters/tag-target-runner.adapter";
import { PrepareTagSyncUseCaseImpl } from "#/domains/tag/application/use-cases/prepare-tag-sync.use-case";
import { RunTagSyncUseCaseImpl } from "#/domains/tag/application/use-cases/run-tag-sync.use-case";
import {
  PrepareTagSyncUseCaseToken,
  PresentTagSyncResultPresenterToken,
  RunTagSyncUseCaseToken,
  TagEligibleWorkspacePathsPortToken,
  TagSinceWriterPortToken,
  PresentTagSyncProgressPresenterToken,
  TagTargetPathResolverPortToken,
  TagTargetRunnerPortToken,
  TagVersionResolverPortToken,
} from "#/domains/tag/composition/tokens";
import { PresentTagSyncResultPresenter } from "#/domains/tag/presentation/presenters/present-tag-sync-result.presenter";
import { PresentTagSyncProgressPresenter } from "#/domains/tag/presentation/presenters/present-tag-sync-progress.presenter";
import { ShellInfrastructureModule } from "#/shell/shell.module";
import { createOptionalCliPortTelemetryActivation } from "#/shell/wiring/optional-cli-port-telemetry-activation";

export const TagModule = Module.create("cli-tag", (moduleBuilder) => {
  moduleBuilder.import(ShellInfrastructureModule);

  moduleBuilder
    .bind(TagEligibleWorkspacePathsPortToken)
    .to(TagTargetResolverAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(TagEligibleWorkspacePathsPortToken));

  moduleBuilder
    .bind(TagSinceWriterPortToken)
    .to(TagSinceWriterAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(TagSinceWriterPortToken));

  moduleBuilder
    .bind(TagVersionResolverPortToken)
    .to(TagVersionResolverAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(TagVersionResolverPortToken));

  moduleBuilder
    .bind(TagTargetRunnerPortToken)
    .to(TagTargetRunnerAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(TagTargetRunnerPortToken));

  moduleBuilder
    .bind(TagTargetPathResolverPortToken)
    .to(TagTargetPathResolverAdapter)
    .singleton()
    .onActivation(createOptionalCliPortTelemetryActivation(TagTargetPathResolverPortToken));

  moduleBuilder.bind(PrepareTagSyncUseCaseToken).to(PrepareTagSyncUseCaseImpl).singleton();
  moduleBuilder.bind(RunTagSyncUseCaseToken).to(RunTagSyncUseCaseImpl).singleton();

  moduleBuilder
    .bind(PresentTagSyncResultPresenterToken)
    .to(PresentTagSyncResultPresenter)
    .singleton();
  moduleBuilder
    .bind(PresentTagSyncProgressPresenterToken)
    .to(PresentTagSyncProgressPresenter)
    .singleton();
});
