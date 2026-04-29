import type { Command as CommanderProgram } from "commander";

export interface CliCommand {
  readonly name: string;
  readonly description: string;
  register(program: CommanderProgram): void;
}
