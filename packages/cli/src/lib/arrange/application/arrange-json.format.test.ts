import { describe, expect, it } from "vitest";
import { formatArrangeAnalyzeJsonOutput } from "#/lib/arrange/presentation/arrange-analyze.presenter";
import {
  formatArrangeGroupJsonOutput,
  formatArrangeSyncJsonOutput,
} from "#/lib/arrange/presentation/arrange-sync.presenter";
import type { AnalyzeReport, ArrangeRunResult } from "#/lib/arrange/domain/types.domain";

describe("arrange JSON formatters", () => {
  it("formatArrangeAnalyzeJsonOutput embeds report", () => {
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

  it("formatArrangeSyncJsonOutput sets ok from hookError", () => {
    const result: ArrangeRunResult = {
      filePaths: [],
      modifiedFiles: [],
      totalFound: 0,
      totalChanged: 0,
      hookError: null,
      previewPlans: [],
    };
    const okParsed = JSON.parse(formatArrangeSyncJsonOutput(result, false)) as { ok: boolean };
    expect(okParsed.ok).toBe(true);
    const errParsed = JSON.parse(
      formatArrangeSyncJsonOutput({ ...result, hookError: "e" }, true),
    ) as { ok: boolean };
    expect(errParsed.ok).toBe(false);
  });

  it("formatArrangeGroupJsonOutput wraps lines", () => {
    const parsed = JSON.parse(
      formatArrangeGroupJsonOutput({ primaryLine: 'cn("a")', bucketsCommentLine: "// x" }),
    ) as { schemaVersion: number; primaryLine: string };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.primaryLine).toBe('cn("a")');
  });
});
