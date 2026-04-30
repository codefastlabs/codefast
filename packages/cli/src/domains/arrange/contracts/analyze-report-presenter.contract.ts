import type { AnalyzeReport } from "#/domains/arrange/domain/types.domain";

export interface PresentAnalyzeReportPresenter {
  present(resolvedTargetPath: string, report: AnalyzeReport): void;
}
