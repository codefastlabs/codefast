import { Module } from "@codefast/di";
import { LoadCodefastConfigUseCaseToken } from "#/lib/core/contracts/tokens";
import { InfraModule } from "#/lib/core/infra/infra.module";
import { LoadCodefastConfigUseCaseImpl } from "#/lib/core/application/load-codefast-config.use-case";

export const PresentationModule = Module.create("cli-presentation", (moduleBuilder) => {
  moduleBuilder.import(InfraModule);

  moduleBuilder.bind(LoadCodefastConfigUseCaseToken).to(LoadCodefastConfigUseCaseImpl).singleton();
});
