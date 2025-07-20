/**
 * Application Module
 *
 * InversifyJS module for binding application layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import { AnalyzeProjectUseCase } from "@/core/application/use-cases/analyze-project.use-case";
import { CheckComponentTypesUseCase } from "@/core/application/use-cases/check-component-types.use-case";
import { GreetUserUseCase } from "@/core/application/use-cases/greet-user.use-case";
import { TYPES } from "@/di/types";

export const applicationModule = new ContainerModule((options) => {
  // Use Cases
  options.bind<AnalyzeProjectUseCase>(TYPES.AnalyzeProjectUseCase).to(AnalyzeProjectUseCase);
  options
    .bind<CheckComponentTypesUseCase>(TYPES.CheckComponentTypesUseCase)
    .to(CheckComponentTypesUseCase);
  options.bind<GreetUserUseCase>(TYPES.GreetUserUseCase).to(GreetUserUseCase);
});
