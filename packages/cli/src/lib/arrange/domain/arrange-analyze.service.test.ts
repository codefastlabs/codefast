import {
  accumulateAnalyzeReportForSourceFile,
  createEmptyAnalyzeReport,
} from "#/lib/arrange/domain/arrange-analyze.service";
import type { DomainSourceFile } from "#/lib/arrange/domain/ast/ast-node.model";

describe("arrange-analyze.service", () => {
  it("createEmptyAnalyzeReport initializes counters", () => {
    const report = createEmptyAnalyzeReport();
    expect(report.files).toBe(0);
    expect(report.cnCallExpressions).toBe(0);
    expect(report.tvCallExpressions).toBe(0);
    expect(report.longCnStringLiterals).toEqual([]);
  });

  it("accumulateAnalyzeReportForSourceFile increments files for an empty statement list", () => {
    const report = createEmptyAnalyzeReport();
    const domainSf = {
      fileName: "/x.ts",
      statements: [],
    } as unknown as DomainSourceFile;
    accumulateAnalyzeReportForSourceFile(report, domainSf, "", "/x.ts");
    expect(report.files).toBe(1);
  });
});
