/**
 * Hello Command
 *
 * CLI command for greeting users.
 * Following explicit architecture guidelines for command organization.
 */

import type { Command } from "commander";

import { inject, injectable } from "inversify";

import type { CommandInterface } from "@/commands/interfaces/command.interface";
import type { GreetUserUseCase } from "@/core/application/use-cases/greet-user.use-case";

import { TYPES } from "@/di/types";

@injectable()
export class HelloCommand implements CommandInterface {
  readonly name = "hello";
  readonly description = "Say hello";

  constructor(
    @inject(TYPES.GreetUserUseCase)
    private readonly greetUserUseCase: GreetUserUseCase,
  ) {}

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .option("-n, --name <name>", "name to greet", "World")
      .action((options: { name: string }) => {
        this.greetUserUseCase.execute({ name: options.name });
      });
  }
}
