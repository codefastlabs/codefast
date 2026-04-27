import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { PresentAnalyzeReportPresenter } from "#/lib/arrange/contracts/analyze-report-presenter.contract";

export const PresentAnalyzeReportPresenterToken: Token<PresentAnalyzeReportPresenter> =
  token<PresentAnalyzeReportPresenter>("PresentAnalyzeReportPresenter");
