import { Container, type ContainerInterface } from "@codefast/di";
import { CliApplicationModule } from "#/bootstrap/cli-application.module";
import type { CliCommand } from "#/shell/contracts/cli-command.contract";
import { CliCommandToken } from "#/shell/contracts/tokens";

export function createCliRuntimeContainer(): ContainerInterface {
  const runtimeContainer = Container.create();
  runtimeContainer.load(CliApplicationModule);
  return runtimeContainer;
}

export function resolveCliCommands(
  runtimeContainer: Pick<ContainerInterface, "resolveAll">,
): readonly CliCommand[] {
  const cliCommands = runtimeContainer.resolveAll(CliCommandToken);
  return [...cliCommands].sort((left, right) => left.name.localeCompare(right.name));
}
