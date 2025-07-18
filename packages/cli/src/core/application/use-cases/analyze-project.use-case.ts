/**
 * Analyze Project Use Case
 *
 * Application layer use case for analyzing TypeScript projects.
 * Following explicit architecture guidelines for CLI applications.
 */

import { inject, injectable } from "inversify";

import type { FileSystemService } from "@/core/application/ports/file-system.port";
import type { LoggingService } from "@/core/application/ports/logging.port";
import type { TypeScriptAnalysisService } from "@/core/application/ports/typescript-analysis.port";

import { TYPES } from "@/di/types";

export interface AnalyzeProjectInput {
  pattern?: string;
  tsConfigPath?: string;
}

@injectable()
export class AnalyzeProjectUseCase {
  constructor(
    @inject(TYPES.LoggingService) private readonly loggingService: LoggingService,
    @inject(TYPES.FileSystemService) private readonly fileSystemService: FileSystemService,
    @inject(TYPES.TypeScriptAnalysisService)
    private readonly analysisService: TypeScriptAnalysisService,
  ) {}

  async execute(input: AnalyzeProjectInput = {}): Promise<void> {
    const { pattern = "src/**/*.ts", tsConfigPath } = input;

    this.loggingService.info("🔍 Analyzing TypeScript project...");

    // Find TypeScript files
    const files = await this.fileSystemService.findFiles(pattern);

    this.loggingService.success(`Found ${String(files.length)} TypeScript files`);

    if (files.length === 0) {
      this.loggingService.warning("No TypeScript files found to analyze");

      return;
    }

    try {
      // Create an analysis project
      this.analysisService.createProject(tsConfigPath);

      // Add source files for analysis
      this.analysisService.addSourceFiles(files);

      // Get project statistics
      const statistics = this.analysisService.getProjectStatistics();

      // Display results
      this.loggingService.warning(
        `Loaded ${String(statistics.totalFiles)} source files for analysis`,
      );
      this.loggingService.info("📊 Project Statistics:");
      this.loggingService.info(`  Classes: ${String(statistics.totalClasses)}`);
      this.loggingService.info(`  Functions: ${String(statistics.totalFunctions)}`);
      this.loggingService.info(`  Interfaces: ${String(statistics.totalInterfaces)}`);
    } catch (error) {
      this.loggingService.error(`Error analyzing project: ${String(error)}`);
    } finally {
      // Clean up
      this.analysisService.reset();
    }
  }
}
