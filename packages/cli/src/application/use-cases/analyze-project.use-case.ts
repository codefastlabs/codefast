/**
 * Analyze Project Use Case
 *
 * Application layer use case for analyzing TypeScript projects.
 * Following explicit architecture guidelines for CLI applications.
 */

import { inject, injectable } from "inversify";

import type { TypeScriptAnalysisPort } from "../ports/analysis/typescript.analysis.port";
import type { LoggingServicePort } from "../ports/services/logging.service.port";
import type { FileSystemSystemPort } from "../ports/system/file-system.system.port";

import { Project } from "../../domain/entities/project.entity";
import { FilePath } from "../../domain/value-objects/file-path.value-object";
import { ProjectStatistics } from "../../domain/value-objects/project-statistics.value-object";
import { TYPES } from "../../shared/di/types";

export interface AnalyzeProjectInput {
  pattern?: string;
  tsConfigPath?: string;
}

@injectable()
export class AnalyzeProjectUseCase {
  constructor(
    @inject(TYPES.LoggingServicePort)
    private readonly loggingService: LoggingServicePort,
    @inject(TYPES.FilesystemSystemPort)
    private readonly fileSystemService: FileSystemSystemPort,
    @inject(TYPES.TypeScriptAnalysisPort)
    private readonly analysisService: TypeScriptAnalysisPort,
  ) {}

  async execute(input: AnalyzeProjectInput = {}): Promise<void> {
    const { pattern = "src/**/*.ts", tsConfigPath } = input;

    this.loggingService.info("🔍 Analyzing TypeScript project...");

    // Find TypeScript files
    const filePathStrings = await this.fileSystemService.findFiles(pattern);

    this.loggingService.success(`Found ${String(filePathStrings.length)} TypeScript files`);

    if (filePathStrings.length === 0) {
      this.loggingService.warning("No TypeScript files found to analyze");

      return;
    }

    try {
      // Create domain entities
      const project = new Project("analysis-project", tsConfigPath);
      const filePaths = filePathStrings.map(path => new FilePath(path));

      // Add source files to project
      project.addSourceFiles(filePaths);

      // Create an analysis project
      this.analysisService.createProject(tsConfigPath);

      // Add source files for analysis
      this.analysisService.addSourceFiles(filePathStrings);

      // Get project statistics
      const statisticsData = this.analysisService.getProjectStatistics();
      const statistics = new ProjectStatistics(
        statisticsData.totalFiles,
        statisticsData.totalClasses,
        statisticsData.totalFunctions,
        statisticsData.totalInterfaces
      );

      // Update project with statistics
      project.updateStatistics(statistics);

      // Display results
      this.loggingService.warning(
        `Loaded ${String(statistics.totalFiles)} source files for analysis`,
      );
      this.loggingService.info("📊 Project Statistics:");
      this.loggingService.info(`  Classes: ${String(statistics.totalClasses)}`);
      this.loggingService.info(`  Functions: ${String(statistics.totalFunctions)}`);
      this.loggingService.info(`  Interfaces: ${String(statistics.totalInterfaces)}`);
      this.loggingService.info(`  Total Symbols: ${String(statistics.totalSymbols)}`);
      this.loggingService.info(`  Average Symbols per File: ${String(statistics.averageSymbolsPerFile.toFixed(2))}`);
    } catch (error) {
      this.loggingService.error(`Error analyzing project: ${String(error)}`);
    } finally {
      // Clean up
      this.analysisService.reset();
    }
  }
}
