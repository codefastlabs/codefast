/**
 * Presentation Module
 *
 * InversifyJS module for binding presentation layer dependencies.
 * Following explicit architecture guidelines for CLI applications.
 */

import { ContainerModule } from "inversify";

import { TYPES } from "@/di/types";
import { CLIApplication } from "@/presentation/cli-application";

export const presentationModule = new ContainerModule(({ bind }) => {
  // CLI Application
  bind<CLIApplication>(TYPES.CLIApplication).to(CLIApplication).inSingletonScope();
});
