import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";

export type ArrangeAnalyzeJsonPayloadV1 = {
  readonly schemaVersion: 1;
  readonly analyzeRootPath: string;
  readonly report: AnalyzeReport;
};

export function formatArrangeAnalyzeJsonOutput(
  analyzeRootPath: string,
  report: AnalyzeReport,
): string {
  const payload: ArrangeAnalyzeJsonPayloadV1 = {
    schemaVersion: 1,
    analyzeRootPath,
    report,
  };
  return JSON.stringify(payload);
}
