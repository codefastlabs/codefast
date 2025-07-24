/**
 * Analyze Command
 *
 * CLI command for analyzing TypeScript projects.
 * Following explicit architecture guidelines for command organization.
 */

import type { Command } from "commander";

import { inject, injectable } from "inversify";

import type { AnalyzeProjectUseCase } from "../../../application/use-cases/analyze-project.use-case";
import type { CommandInterface } from "../interfaces/command.interface";

import { TYPES } from "../../../shared/di/types";

@injectable()
export class AnalyzeCommand implements CommandInterface {
  readonly name = "analyze";
  readonly description = "Analyze TypeScript project";

  constructor(
    @inject(TYPES.AnalyzeProjectUseCase)
    private readonly analyzeProjectUseCase: AnalyzeProjectUseCase,
  ) {}

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .option("-p, --pattern <pattern>", "file pattern to analyze", "src/**/*.ts")
      .option("-c, --config <path>", "path to tsconfig.json")
      .action(async (options: { pattern?: string; config?: string }) => {
        await this.analyzeProjectUseCase.execute({
          pattern: options.pattern,
          tsConfigPath: options.config,
        });
      });
  }
}
