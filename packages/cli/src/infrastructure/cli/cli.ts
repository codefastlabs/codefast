import { Command } from "commander";

import { createValidateComponentsCommand } from "./commands/validate-components.command";

export function createCLI(): Command {
  const program = new Command();

  program
    .name("codefast")
    .description("CodeFast CLI - Tools for maintaining React component standards")
    .version("0.3.7-canary.0");

  // Register commands
  program.addCommand(createValidateComponentsCommand());

  return program;
}

export async function runCLI(args: string[] = process.argv): Promise<void> {
  const program = createCLI();

  await program.parseAsync(args);
}
