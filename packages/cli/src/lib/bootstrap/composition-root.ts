import { Container, type ContainerInterface } from "@codefast/di";
import { ArrangeCommand } from "#/lib/arrange/adapters/primary/cli/arrange.command";
import { ArrangeModule } from "#/lib/arrange/arrange.module";
import { MirrorCommand } from "#/lib/mirror/adapters/primary/cli/mirror.command";
import { MirrorModule } from "#/lib/mirror/mirror.module";
import { TagCommand } from "#/lib/tag/adapters/primary/cli/tag.command";
import { TagModule } from "#/lib/tag/tag.module";
import type { CliCommand } from "#/lib/kernel/contracts/cli-command.contract";
import { CliCommandToken } from "#/lib/kernel/contracts/tokens";

export function createCliRuntimeContainer(): ContainerInterface {
  const runtimeContainer = Container.create();

  runtimeContainer.load(ArrangeModule);
  runtimeContainer.bind(CliCommandToken).to(ArrangeCommand).whenNamed("arrange").singleton();

  runtimeContainer.load(MirrorModule);
  runtimeContainer.bind(CliCommandToken).to(MirrorCommand).whenNamed("mirror").singleton();

  runtimeContainer.load(TagModule);
  runtimeContainer.bind(CliCommandToken).to(TagCommand).whenNamed("tag").singleton();

  return runtimeContainer;
}

export function resolveCliCommands(
  runtimeContainer: Pick<ContainerInterface, "resolveAll">,
): readonly CliCommand[] {
  const cliCommands = runtimeContainer.resolveAll(CliCommandToken);
  return [...cliCommands].sort((left, right) => left.name.localeCompare(right.name));
}
