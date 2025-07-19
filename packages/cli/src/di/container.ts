/**
 * Dependency Injection Container
 *
 * Main IoC container configuration using InversifyJS.
 * Following explicit architecture guidelines for CLI applications.
 */

import { Container } from "inversify";

import { applicationModule } from "@/di/modules/application.module";
import { infrastructureModule } from "@/di/modules/infrastructure.module";
import { presentationModule } from "@/di/modules/presentation.module";

/**
 * Main IoC container instance
 */
export const container = new Container({
  defaultScope: "Singleton",
});

/**
 * Configure the container with all modules
 */
export function configureContainer(): Container {
  // Load modules in dependency order
  container.loadSync(infrastructureModule, applicationModule, presentationModule);

  return container;
}

/**
 * Get a service from the container
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getService<T>(serviceIdentifier: symbol): T {
  return container.get<T>(serviceIdentifier);
}
