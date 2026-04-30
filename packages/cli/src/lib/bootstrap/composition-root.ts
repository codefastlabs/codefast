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
  runtimeContainer.bind(CliCommandToken).to(ArrangeCommand).whenNamed("arrange").singleton();

  runtimeContainer.load(MirrorModule);
  runtimeContainer.bind(CliCommandToken).to(MirrorCommand).whenNamed("mirror").singleton();

  runtimeContainer.load(TagPresentationModule, TagModule);
  runtimeContainer.bind(CliCommandToken).to(TagCommand).whenNamed("tag").singleton();

  return runtimeContainer;
}

export function resolveCliCommands(
  runtimeContainer: ReturnType<typeof Container.create>,
): readonly CliCommand[] {
  const cliCommands = runtimeContainer.resolveAll(CliCommandToken);
  return [...cliCommands].sort((left, right) => left.name.localeCompare(right.name));
}
