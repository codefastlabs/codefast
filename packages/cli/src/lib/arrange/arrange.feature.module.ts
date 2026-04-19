import { Module } from "@codefast/di";
import type { Container } from "@codefast/di";
import { ArrangeCommand } from "#/commands/arrange";
import { ArrangeModule } from "#/lib/arrange/arrange.module";
import { ArrangePresentationModule } from "#/lib/arrange/arrange.presentation.module";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { COMMAND_TOKEN } from "#/lib/kernel/di/command.token";

export const ArrangeFeatureModule = Module.create("cli-arrange-feature", (moduleBuilder) => {
  moduleBuilder.import(ArrangePresentationModule, ArrangeModule);
  moduleBuilder.bind(ArrangeCommand).to(ArrangeCommand).singleton();
});

export function registerArrangeFeature(
  runtimeContainer: ReturnType<typeof Container.create>,
): void {
  runtimeContainer.load(ArrangeFeatureModule);
  runtimeContainer.bind(COMMAND_TOKEN).to(ArrangeCommand).singleton().whenNamed("arrange");
}

export function resolveArrangeCommand(
  runtimeContainer: ReturnType<typeof Container.create>,
): CliCommand {
  return runtimeContainer.resolve(ArrangeCommand);
}
