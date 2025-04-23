import { Command } from "commander";
import { inject, injectable } from "inversify";
import process from "node:process";

import type { CreateProjectUseCase } from "@/application/use-cases/create-project.use-case";

import { TYPES } from "@/ioc/types";

@injectable()
export class CreateProjectCommand {
  constructor(@inject(TYPES.CreateProjectUseCase) private createProjectUseCase: CreateProjectUseCase) {}

  /**
   * Returns a Commander.js command for creating or configuring a project.
   *
   * @returns Configured Commander.js command.
   */
  getCommand(): Command {
    return new Command()
      .name("create-project")
      .description("Create a new Next.js project with TypeScript, TailwindCSS, and linting setup")
      .argument("[project-name]", "Name of the project to create")
      .action(async (projectName: string) => {
        await this.createProjectUseCase.execute(projectName);

        process.exit(0);
      });
  }
}
