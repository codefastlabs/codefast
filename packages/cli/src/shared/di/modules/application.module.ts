/**
 * Application Module
 *
 * InversifyJS module for binding application layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import { AnalyzeTreeShakingUseCase } from "@/application/use-cases/analyze-tree-shaking.use-case";
import { CheckComponentTypesUseCase } from "@/application/use-cases/check-component-types.use-case";
import { GreetUserUseCase } from "@/application/use-cases/greet-user.use-case";
import { DI_TYPES } from "@/shared/di/types";

export const applicationModule = new ContainerModule((options) => {


  // Use Cases
  options
    .bind<AnalyzeTreeShakingUseCase>(DI_TYPES.AnalyzeTreeShakingUseCase)
    .to(AnalyzeTreeShakingUseCase);
  options
    .bind<CheckComponentTypesUseCase>(DI_TYPES.CheckComponentTypesUseCase)
    .to(CheckComponentTypesUseCase);
  options.bind<GreetUserUseCase>(DI_TYPES.GreetUserUseCase).to(GreetUserUseCase);
});
