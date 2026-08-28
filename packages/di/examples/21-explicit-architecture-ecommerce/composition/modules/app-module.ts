/** The root module — imports every layer module into one composable unit. */

import { Module } from "@codefast/di";

import { applicationModule } from "#/examples/21-explicit-architecture-ecommerce/composition/modules/application-module";
import { domainModule } from "#/examples/21-explicit-architecture-ecommerce/composition/modules/domain-module";
import { infrastructureModule } from "#/examples/21-explicit-architecture-ecommerce/composition/modules/infrastructure-module";
import { presentationModule } from "#/examples/21-explicit-architecture-ecommerce/composition/modules/presentation-module";

/** Aggregates the domain, infrastructure, application, and presentation modules. */
export const appModule = Module.create("App", (builder) => {
  builder.import(domainModule, infrastructureModule, applicationModule, presentationModule);
});
