import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";

export interface PresentAnalyzeReportPresenter {
  present(resolvedTargetPath: string, report: AnalyzeReport): void;
}
