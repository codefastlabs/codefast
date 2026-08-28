/** The composition root — assembles the app module into a validated container. */

import { Container } from "@codefast/di";

import { appModule } from "#/examples/21-explicit-architecture-ecommerce/composition/modules/app-module";

/** Builds the container from every module and fails fast if any port lacks a compatible adapter. */
export function createContainer(): Container {
  const container = Container.fromModules(appModule);

  container.validate();

  return container;
}
