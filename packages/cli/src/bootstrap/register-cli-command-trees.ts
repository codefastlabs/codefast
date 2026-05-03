import type { Command } from "commander";
import type { CommandPort } from "#/shell/application/ports/primary/command.port";
import { CommanderCliHostAdapter } from "#/shell/infrastructure/commander/commander-cli-host.adapter";

/** Composition root: attach declarative CLI trees from the container onto the Commander program. */
export function registerCliCommandTreesOnProgram(
  programRoot: Command,
  commands: readonly CommandPort[],
): void {
  CommanderCliHostAdapter.registerTrees(
    programRoot,
    commands.map((cliEntry) => cliEntry.definition),
  );
}
