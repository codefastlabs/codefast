import { describe, expect, it } from "vitest";
import type { AnalyzeReport } from "#/lib/arrange/domain/types.domain";
import { formatArrangeAnalyzeJsonOutput } from "#/lib/arrange/presentation/arrange-analyze.presenter";

describe("formatArrangeAnalyzeJsonOutput", () => {
  it("embeds report", () => {
    const report: AnalyzeReport = {
      files: 0,
      cnCallExpressions: 0,
      tvCallExpressions: 0,
      cnInsideTvCalls: [],
      longCnStringLiterals: [],
      longTvStringLiterals: [],
      longJsxClassNameLiterals: [],
    };
    const parsed = JSON.parse(formatArrangeAnalyzeJsonOutput("/src", report)) as {
      schemaVersion: number;
      analyzeRootPath: string;
      report: AnalyzeReport;
    };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.analyzeRootPath).toBe("/src");
    expect(parsed.report.files).toBe(0);
  });
});
