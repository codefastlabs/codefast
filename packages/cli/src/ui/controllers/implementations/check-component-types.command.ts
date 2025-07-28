/**
 * Check Component Types Command
 *
 * CLI command for checking React component type correspondence.
 * Following explicit architecture guidelines for command organization.
 */

import type { Command } from "commander";

import { inject, injectable } from "inversify";

import type { CheckComponentTypesUseCase } from "@/application/use-cases/check-component-types.use-case";
import type { CommandInterface } from "@/ui/controllers/interfaces/command.interface";

import { DI_TYPES } from "@/shared/di/types";

@injectable()
export class CheckComponentTypesCommand implements CommandInterface {
  readonly name = "check-component-types";
  readonly description = "Check React component type correspondence";

  constructor(
    @inject(DI_TYPES.CheckComponentTypesUseCase)
    private readonly checkComponentTypesUseCase: CheckComponentTypesUseCase,
  ) {}

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .option("-d, --packages-dir <dir>", "packages directory to analyze", "packages")
      .action((options: { packagesDir?: string }) => {
        this.checkComponentTypesUseCase.execute({
          packagesDirectory: options.packagesDir,
        });
      });
  }
}
