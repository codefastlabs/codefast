/** The composition root — the single place that knows every module and hands back a wired container. */

import { Container, Module } from "@codefast/di";

import { applicationModule } from "#/examples/20-explicit-architecture/composition/application.module";
import { infrastructureModule } from "#/examples/20-explicit-architecture/composition/infrastructure.module";

/** Assembles the infrastructure and application modules and validates the graph before returning it. */
export function buildContainer(): Container {
  const bankingModule = Module.create("Banking", (builder) => {
    builder.import(infrastructureModule, applicationModule);
  });

  const container = Container.fromModules(bankingModule);

  // Fail fast at the edge: catch a missing or scope-incompatible adapter before serving traffic.
  container.validate();

  return container;
}
