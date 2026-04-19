import { Module } from "@codefast/di";
import type { Container } from "@codefast/di";
import { TagCommand } from "#/commands/tag";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { COMMAND_TOKEN } from "#/lib/kernel/di/command.token";
import { TagModule } from "#/lib/tag/tag.module";
import { TagPresentationModule } from "#/lib/tag/tag.presentation.module";

export const TagFeatureModule = Module.create("cli-tag-feature", (moduleBuilder) => {
  moduleBuilder.import(TagPresentationModule, TagModule);
  moduleBuilder.bind(TagCommand).to(TagCommand).singleton();
});

export function registerTagFeature(runtimeContainer: ReturnType<typeof Container.create>): void {
  runtimeContainer.load(TagFeatureModule);
  runtimeContainer.bind(COMMAND_TOKEN).to(TagCommand).singleton().whenNamed("tag");
}

export function resolveTagCommand(
  runtimeContainer: ReturnType<typeof Container.create>,
): CliCommand {
  return runtimeContainer.resolve(TagCommand);
}
