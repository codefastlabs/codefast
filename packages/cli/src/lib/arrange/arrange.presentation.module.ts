import { Module } from "@codefast/di";
import {
  PrepareArrangeOrchestratorToken,
  PresentAnalyzeReportPresenterToken,
} from "#/lib/arrange/contracts/tokens";
import { PrepareArrangeOrchestrator } from "#/lib/arrange/presentation/prepare-arrange.orchestrator";
import { PresentAnalyzeReportPresenterImpl } from "#/lib/arrange/presentation/present-analyze-report.presenter";
import { PresentationModule } from "#/lib/core/presentation/presentation.module";

export const ArrangePresentationModule = Module.create(
  "cli-arrange-presentation",
  (moduleBuilder) => {
    moduleBuilder.import(PresentationModule);
    moduleBuilder.bind(PrepareArrangeOrchestratorToken).to(PrepareArrangeOrchestrator).singleton();
    moduleBuilder
      .bind(PresentAnalyzeReportPresenterToken)
      .to(PresentAnalyzeReportPresenterImpl)
      .singleton();
  },
);
