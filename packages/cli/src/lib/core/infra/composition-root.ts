import { Container } from "@codefast/di";
import { ArrangeCommand } from "#/lib/arrange/presentation/arrange.command";
import { ArrangeModule } from "#/lib/arrange/arrange.module";
import { ArrangePresentationModule } from "#/lib/arrange/arrange.presentation.module";
import { MirrorCommand } from "#/lib/mirror/presentation/mirror.command";
import { MirrorModule } from "#/lib/mirror/mirror.module";
import { MirrorPresentationModule } from "#/lib/mirror/mirror.presentation.module";
import { TagCommand } from "#/lib/tag/presentation/tag.command";
import { TagModule } from "#/lib/tag/tag.module";
import { TagPresentationModule } from "#/lib/tag/tag.presentation.module";
import type { CliCommand } from "#/lib/core/presentation/command.interface";
import { COMMAND_TOKEN } from "#/lib/kernel/di/command.token";

export function createCliRuntimeContainer(): ReturnType<typeof Container.create> {
  const runtimeContainer = Container.create();

  runtimeContainer.load(ArrangePresentationModule, ArrangeModule);
  runtimeContainer.bind(ArrangeCommand).to(ArrangeCommand).singleton();
  runtimeContainer.bind(COMMAND_TOKEN).to(ArrangeCommand).singleton().whenNamed("arrange");

  runtimeContainer.load(MirrorPresentationModule, MirrorModule);
  runtimeContainer.bind(MirrorCommand).to(MirrorCommand).singleton();
  runtimeContainer.bind(COMMAND_TOKEN).to(MirrorCommand).singleton().whenNamed("mirror");

  runtimeContainer.load(TagPresentationModule, TagModule);
  runtimeContainer.bind(TagCommand).to(TagCommand).singleton();
  runtimeContainer.bind(COMMAND_TOKEN).to(TagCommand).singleton().whenNamed("tag");

  return runtimeContainer;
}

export function resolveCliCommands(
  runtimeContainer: ReturnType<typeof Container.create>,
): readonly CliCommand[] {
  return [
    runtimeContainer.resolve(ArrangeCommand),
    runtimeContainer.resolve(MirrorCommand),
    runtimeContainer.resolve(TagCommand),
  ];
}
