import { Container } from "@codefast/di";
import { ArrangeCommand } from "#/lib/arrange/adapters/primary/cli/arrange.command";
import { ArrangePresentationModule } from "#/lib/arrange/adapters/primary/cli/arrange.presentation.module";
import { ArrangeModule } from "#/lib/arrange/arrange.module";
import { MirrorCommand } from "#/lib/mirror/adapters/primary/cli/mirror.command";
import { MirrorModule } from "#/lib/mirror/mirror.module";
import { TagCommand } from "#/lib/tag/adapters/primary/cli/tag.command";
import { TagPresentationModule } from "#/lib/tag/adapters/primary/cli/tag.presentation.module";
import { TagModule } from "#/lib/tag/tag.module";
import type { CliCommand } from "#/lib/kernel/contracts/cli-command.contract";
import { CliCommandToken } from "#/lib/kernel/contracts/tokens";

export function createCliRuntimeContainer(): ReturnType<typeof Container.create> {
  const runtimeContainer = Container.create();

  runtimeContainer.load(ArrangePresentationModule, ArrangeModule);
  runtimeContainer.bind(ArrangeCommand).to(ArrangeCommand).singleton();
  runtimeContainer.bind(CliCommandToken).to(ArrangeCommand).singleton().whenNamed("arrange");

  runtimeContainer.load(MirrorModule);
  runtimeContainer.bind(MirrorCommand).to(MirrorCommand).singleton();
  runtimeContainer.bind(CliCommandToken).to(MirrorCommand).singleton().whenNamed("mirror");

  runtimeContainer.load(TagPresentationModule, TagModule);
  runtimeContainer.bind(TagCommand).to(TagCommand).singleton();
  runtimeContainer.bind(CliCommandToken).to(TagCommand).singleton().whenNamed("tag");

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
