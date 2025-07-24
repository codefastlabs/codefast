/**
 * Get Project Statistics Query Handler
 *
 * Handles the GetProjectStatisticsQuery by coordinating with infrastructure
 * services and returning domain objects without presentation concerns.
 */

import { inject, injectable } from "inversify";

import type { TypeScriptAnalysisPort } from "../ports/secondary/analysis/typescript.analysis.port";
import type { FileSystemSystemPort } from "../ports/secondary/system/file-system.system.port";
import type { GetProjectStatisticsQuery } from "./get-project-statistics.query";
import type { QueryHandler } from "./query-handler.interface";

import { Project } from "../../domain/entities/project.entity";
import { FilePath } from "../../domain/value-objects/file-path.value-object";
import { ProjectStatistics } from "../../domain/value-objects/project-statistics.value-object";
import { TYPES } from "../../shared/di/types";

export interface GetProjectStatisticsResult {
  filePaths: FilePath[];
  project: Project;
}

@injectable()
export class GetProjectStatisticsQueryHandler
  implements QueryHandler<GetProjectStatisticsQuery, GetProjectStatisticsResult>
{
  constructor(
    @inject(TYPES.FilesystemSystemPort)
    private readonly fileSystemService: FileSystemSystemPort,
    @inject(TYPES.TypeScriptAnalysisPort)
    private readonly analysisService: TypeScriptAnalysisPort,
  ) {}

  async handle(query: GetProjectStatisticsQuery): Promise<GetProjectStatisticsResult> {
    // Find TypeScript files
    const filePathStrings = await this.fileSystemService.findFiles(query.pattern);

    if (filePathStrings.length === 0) {
      throw new Error("No TypeScript files found to analyze");
    }

    try {
      // Create domain entities
      const project = new Project("analysis-project", query.tsConfigPath);
      const filePaths = filePathStrings.map((path) => new FilePath(path));

      // Add source files to the project
      project.addSourceFiles(filePaths);

      // Create an analysis project
      this.analysisService.createProject(query.tsConfigPath);

      // Add source files for analysis
      this.analysisService.addSourceFiles(filePathStrings);

      // Get project statistics
      const statisticsData = this.analysisService.getProjectStatistics();
      const statistics = new ProjectStatistics(
        statisticsData.totalFiles,
        statisticsData.totalClasses,
        statisticsData.totalFunctions,
        statisticsData.totalInterfaces,
      );

      // Update the project with statistics
      project.updateStatistics(statistics);

      return {
        filePaths,
        project,
      };
    } finally {
      // Clean up
      this.analysisService.reset();
    }
  }
}
