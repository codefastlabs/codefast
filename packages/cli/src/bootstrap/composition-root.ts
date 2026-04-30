import { Container, type ContainerInterface } from "@codefast/di";
import { ArrangeCommand } from "#/domains/arrange/presentation/cli/arrange.command";
import { ArrangeModule } from "#/domains/arrange/arrange.module";
import { MirrorCommand } from "#/domains/mirror/presentation/cli/mirror.command";
import { MirrorModule } from "#/domains/mirror/mirror.module";
import { TagCommand } from "#/domains/tag/presentation/cli/tag.command";
import { TagModule } from "#/domains/tag/tag.module";
import type { CliCommand } from "#/shell/contracts/cli-command.contract";
import { CliCommandToken } from "#/shell/contracts/tokens";

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
