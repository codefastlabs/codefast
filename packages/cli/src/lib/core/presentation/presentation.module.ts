import { Module } from "@codefast/di";
import { TryLoadCodefastConfigPresenterToken } from "#/lib/core/contracts/tokens";
import { InfraModule } from "#/lib/core/infra/infra.module";
import { TryLoadCodefastConfigPresenterImpl } from "#/lib/core/presentation/try-load-codefast-config.presenter";

export const PresentationModule = Module.create("cli-presentation", (moduleBuilder) => {
  moduleBuilder.import(InfraModule);

  moduleBuilder
    .bind(TryLoadCodefastConfigPresenterToken)
    .to(TryLoadCodefastConfigPresenterImpl)
    .singleton();
});
