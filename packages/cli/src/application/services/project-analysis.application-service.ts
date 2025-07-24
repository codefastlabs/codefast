/**
 * Project Analysis Application Service
 *
 * Application service that coordinates between UI layer and CQRS handlers.
 * Following Explicit Architecture guidelines for application services.
 */

import { inject, injectable } from "inversify";

import type {
  GetProjectStatisticsQueryHandler,
  GetProjectStatisticsResult,
} from "@/application/query/get-project-statistics.query-handler";

import { GetProjectStatisticsQuery } from "@/application/query/get-project-statistics.query";
import { TYPES } from "@/shared/di/types";

export interface ProjectAnalysisRequest {
  pattern?: string;
  tsConfigPath?: string;
}

@injectable()
export class ProjectAnalysisApplicationService {
  constructor(
    @inject(TYPES.GetProjectStatisticsQueryHandler)
    private readonly getProjectStatisticsQueryHandler: GetProjectStatisticsQueryHandler,
  ) {}

  async getProjectStatistics(request: ProjectAnalysisRequest): Promise<GetProjectStatisticsResult> {
    const query = new GetProjectStatisticsQuery(
      request.pattern ?? "src/**/*.ts",
      request.tsConfigPath,
    );

    return await this.getProjectStatisticsQueryHandler.handle(query);
  }
}
