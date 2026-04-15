import type { AnalyzeReport, Bucket } from "#lib/arrange/domain/types.domain";

describe("arrange domain types", () => {
  it("allows constructing a minimal AnalyzeReport shape", () => {
    const report: AnalyzeReport = {
      files: 0,
      cnCallExpressions: 0,
      tvCallExpressions: 0,
      cnInsideTvCalls: [],
      longCnStringLiterals: [],
      longTvStringLiterals: [],
      longJsxClassNameLiterals: [],
    };
    expect(report.files).toBe(0);
  });

  it("Bucket is a string union at compile time", () => {
    const bucket: Bucket = "layout";
    expect(bucket).toBe("layout");
  });
});
