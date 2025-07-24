/**
 * Application Module
 *
 * InversifyJS module for binding application layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import { GetProjectStatisticsQueryHandler } from "@/application/query/get-project-statistics.query-handler";
import { ProjectAnalysisApplicationService } from "@/application/services/project-analysis.application-service";
import { AnalyzeProjectUseCase } from "@/application/use-cases/analyze-project.use-case";
import { AnalyzeTreeShakingUseCase } from "@/application/use-cases/analyze-tree-shaking.use-case";
import { CheckComponentTypesUseCase } from "@/application/use-cases/check-component-types.use-case";
import { GreetUserUseCase } from "@/application/use-cases/greet-user.use-case";
import { TYPES } from "@/shared/di/types";

export const applicationModule = new ContainerModule((options) => {
  // Application Services
  options
    .bind<ProjectAnalysisApplicationService>(TYPES.ProjectAnalysisApplicationService)
    .to(ProjectAnalysisApplicationService);

  // Query Handlers
  options
    .bind<GetProjectStatisticsQueryHandler>(TYPES.GetProjectStatisticsQueryHandler)
    .to(GetProjectStatisticsQueryHandler);

  // Use Cases (Legacy - to be refactored)
  options.bind<AnalyzeProjectUseCase>(TYPES.AnalyzeProjectUseCase).to(AnalyzeProjectUseCase);
  options
    .bind<AnalyzeTreeShakingUseCase>(TYPES.AnalyzeTreeShakingUseCase)
    .to(AnalyzeTreeShakingUseCase);
  options
    .bind<CheckComponentTypesUseCase>(TYPES.CheckComponentTypesUseCase)
    .to(CheckComponentTypesUseCase);
  options.bind<GreetUserUseCase>(TYPES.GreetUserUseCase).to(GreetUserUseCase);
});
