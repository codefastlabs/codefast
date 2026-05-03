import { Container, type ContainerInterface } from "@codefast/di";
import { CliApplicationModule } from "#/bootstrap/cli-application.module";
import type { CliCommandPort } from "#/shell/application/ports/primary/cli-command.port";
import { CommandPortToken } from "#/shell/composition/tokens";

export function createCliRuntimeContainer(): ContainerInterface {
  const runtimeContainer = Container.create();
  runtimeContainer.load(CliApplicationModule);
  return runtimeContainer;
}

export function resolveCliCommands(
  runtimeContainer: Pick<ContainerInterface, "resolveAll">,
): readonly CliCommandPort[] {
  const cliCommands = runtimeContainer.resolveAll(CommandPortToken);
  return [...cliCommands].sort((left, right) =>
    left.definition.name.localeCompare(right.definition.name),
  );
}
