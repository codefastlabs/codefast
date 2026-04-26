import { Module } from "@codefast/di";
import { PresentAnalyzeReportPresenterToken } from "#/lib/arrange/contracts/tokens";
import { PresentAnalyzeReportPresenterImpl } from "#/lib/arrange/presentation/arrange-analyze.presenter";
import { PresentationModule } from "#/lib/core/presentation/presentation.module";

export const ArrangePresentationModule = Module.create(
  "cli-arrange-presentation",
  (moduleBuilder) => {
    moduleBuilder.import(PresentationModule);
    moduleBuilder
      .bind(PresentAnalyzeReportPresenterToken)
      .to(PresentAnalyzeReportPresenterImpl)
      .singleton();
  },
);
