import { Module } from "@codefast/di";
import {
  PresentAnalyzeReportPresenterToken,
  GroupFilePreviewPortToken,
} from "#/lib/arrange/contracts/tokens";
import { PresentAnalyzeReportPresenterImpl } from "#/lib/arrange/presentation/arrange-analyze.presenter";
import { GroupFilePreviewPresenterAdapter } from "#/lib/arrange/presentation/group-file-preview.presenter";
import { PresentationModule } from "#/lib/core/presentation/presentation.module";

export const ArrangePresentationModule = Module.create(
  "cli-arrange-presentation",
  (moduleBuilder) => {
    moduleBuilder.import(PresentationModule);
    moduleBuilder
      .bind(PresentAnalyzeReportPresenterToken)
      .to(PresentAnalyzeReportPresenterImpl)
      .singleton();
    moduleBuilder.bind(GroupFilePreviewPortToken).to(GroupFilePreviewPresenterAdapter).singleton();
  },
);
