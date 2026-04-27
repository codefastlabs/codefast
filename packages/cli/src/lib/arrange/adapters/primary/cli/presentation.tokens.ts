import { token } from "@codefast/di";
import type { PresentAnalyzeReportPresenter } from "#/lib/arrange/contracts/analyze-report-presenter.contract";

export const PresentAnalyzeReportPresenterToken = token<PresentAnalyzeReportPresenter>(
  "PresentAnalyzeReportPresenter",
);
