import { PresentAnalyzeReportPresenterImpl } from "#/domains/arrange/presentation/presenters/arrange-analyze.presenter";
import { presentArrangeSyncResult } from "#/domains/arrange/presentation/presenters/arrange-sync.presenter";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { GroupFileWorkPlan } from "#/domains/arrange/domain/arrange-grouping.service";

function createLoggerMock(): CliLoggerPort & {
  out: ReturnType<typeof vi.fn<(line: string) => void>>;
  err: ReturnType<typeof vi.fn<(line: string) => void>>;
} {
  return {
    out: vi.fn<(line: string) => void>(),
    err: vi.fn<(line: string) => void>(),
  };
}

function createPreviewPlan(filePath: string): GroupFileWorkPlan {
  return {
    filePath,
    sourceText: "",
    textAfterUnwrap: "",
    domainSfForLineNumbers: { text: "" } as never,
    domainSfGrouped: { text: "" } as never,
    cnInTvCalls: [],
    unwrapReplacementByCall: new Map(),
    unwrapEdits: [],
    plannedGroupEdits: [],
    cnInTvNoReplacement: 0,
    reportTotal: 0,
    editSitesCount: 0,
  };
}

function createFindings(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    file: `src/file-${index}.tsx`,
    line: index + 1,
    tokenCount: 20,
    preview: "flex gap-2 rounded-md",
  }));
}

describe("arrange presenters integration", () => {
  it("prints analyze report with truncation markers", () => {
    const logger = createLoggerMock();
    const presenter = new PresentAnalyzeReportPresenterImpl(logger);
    const report = {
      files: 3,
      cnCallExpressions: 4,
      tvCallExpressions: 5,
      cnInsideTvCalls: Array.from({ length: 41 }, (_, index) => ({
        file: "src/a.tsx",
        line: index + 1,
        argCount: 2,
        preview: "cn(...)",
      })),
      longCnStringLiterals: createFindings(41),
      longTvStringLiterals: createFindings(41),
      longJsxClassNameLiterals: createFindings(41),
    };

    presenter.present("./src", report);

    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("Path:"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("… and 1 more"));
  });

  it("formats analyze and sync JSON payloads", () => {
    const report = {
      files: 1,
      cnCallExpressions: 1,
      tvCallExpressions: 1,
      cnInsideTvCalls: [],
      longCnStringLiterals: [],
      longTvStringLiterals: [],
      longJsxClassNameLiterals: [],
    };
    const analyzeJson = JSON.stringify({
      schemaVersion: 1,
      analyzeRootPath: "/tmp/app",
      report,
    });
    const arrangeRunResult = {
      filePaths: ["a.tsx"],
      modifiedFiles: ["a.tsx"],
      totalFound: 1,
      totalChanged: 1,
      hookError: null,
      previewPlans: [createPreviewPlan("a.tsx")],
    };
    const { previewPlans: _plans, ...serializableResult } = arrangeRunResult;
    const syncJson = JSON.stringify({
      schemaVersion: 1,
      ok: true,
      write: true,
      result: serializableResult,
    });
    const groupJson = JSON.stringify({
      schemaVersion: 1,
      primaryLine: 'cn("flex", "gap-2")',
      bucketsCommentLine: "// Buckets: layout | spacing",
    });

    expect(analyzeJson).toContain('"schemaVersion":1');
    expect(syncJson).toContain('"write":true');
    expect(syncJson).not.toContain("previewPlans");
    expect(groupJson).toContain('"primaryLine":"cn(\\"flex\\", \\"gap-2\\")"');
  });

  it("returns non-zero when hook error exists and prints error line", () => {
    const logger = createLoggerMock();
    const exitCode = presentArrangeSyncResult(
      logger,
      {
        filePaths: ["a.tsx"],
        modifiedFiles: [],
        totalFound: 2,
        totalChanged: 0,
        hookError: "hook failed",
        previewPlans: [],
      },
      false,
    );

    expect(exitCode).toBe(1);
    expect(logger.err).toHaveBeenCalledWith("hook failed");
  });
});
