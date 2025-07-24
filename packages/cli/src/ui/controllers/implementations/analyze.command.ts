/**
 * Analyze Command
 *
 * CLI command for analyzing TypeScript projects.
 * Following explicit architecture guidelines for command organization.
 */

import type { Command } from "commander";

import { inject, injectable } from "inversify";

import type { LoggingServicePort } from "@/application/ports/secondary/services/logging.service.port";
import type { ProjectAnalysisApplicationService } from "@/application/services/project-analysis.application-service";
import type { CommandInterface } from "@/ui/controllers/interfaces/command.interface";

import { TYPES } from "@/shared/di/types";

@injectable()
export class AnalyzeCommand implements CommandInterface {
  readonly name = "analyze";
  readonly description = "Analyze TypeScript project";

  constructor(
    @inject(TYPES.ProjectAnalysisApplicationService)
    private readonly projectAnalysisService: ProjectAnalysisApplicationService,
    @inject(TYPES.LoggingServicePort)
    private readonly loggingService: LoggingServicePort,
  ) {}

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .option("-p, --pattern <pattern>", "file pattern to analyze", "src/**/*.ts")
      .option("-c, --config <path>", "path to tsconfig.json")
      .action(async (options: { pattern?: string; config?: string }) => {
        try {
          this.loggingService.info("🔍 Analyzing TypeScript project...");

          const result = await this.projectAnalysisService.getProjectStatistics({
            pattern: options.pattern,
            tsConfigPath: options.config,
          });

          const { project } = result;
          const statistics = project.statistics;

          if (!statistics) {
            this.loggingService.warning("No statistics available");

            return;
          }

          this.loggingService.success(`Found ${String(result.filePaths.length)} TypeScript files`);
          this.loggingService.warning(
            `Loaded ${String(statistics.totalFiles)} source files for analysis`,
          );
          this.loggingService.info("📊 Project Statistics:");
          this.loggingService.info(`  Classes: ${String(statistics.totalClasses)}`);
          this.loggingService.info(`  Functions: ${String(statistics.totalFunctions)}`);
          this.loggingService.info(`  Interfaces: ${String(statistics.totalInterfaces)}`);
          this.loggingService.info(`  Total Symbols: ${String(statistics.totalSymbols)}`);
          this.loggingService.info(
            `  Average Symbols per File: ${String(statistics.averageSymbolsPerFile.toFixed(2))}`,
          );
        } catch (error) {
          if (error instanceof Error && error.message === "No TypeScript files found to analyze") {
            this.loggingService.warning("No TypeScript files found to analyze");
          } else {
            this.loggingService.error(`Error analyzing project: ${String(error)}`);
          }
        }
      });
  }
}
