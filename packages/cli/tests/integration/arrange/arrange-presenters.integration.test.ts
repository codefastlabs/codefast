import {
  formatArrangeAnalyzeJsonOutput,
  PresentAnalyzeReportPresenterImpl,
} from "#/lib/arrange/presentation/arrange-analyze.presenter";
import {
  formatArrangeGroupJsonOutput,
  formatArrangeSyncJsonOutput,
  presentArrangeSyncResult,
} from "#/lib/arrange/presentation/arrange-sync.presenter";

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
    const logger = { out: vi.fn(), err: vi.fn() };
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
    const analyzeJson = formatArrangeAnalyzeJsonOutput("/tmp/app", {
      files: 1,
      cnCallExpressions: 1,
      tvCallExpressions: 1,
      cnInsideTvCalls: [],
      longCnStringLiterals: [],
      longTvStringLiterals: [],
      longJsxClassNameLiterals: [],
    });
    const syncJson = formatArrangeSyncJsonOutput(
      {
        filePaths: ["a.tsx"],
        modifiedFiles: ["a.tsx"],
        totalFound: 1,
        totalChanged: 1,
        hookError: null,
        previewPlans: [{ filePath: "a.tsx", plannedGroupEdits: [] }],
      },
      true,
    );
    const groupJson = formatArrangeGroupJsonOutput({
      primaryLine: 'cn("flex", "gap-2")',
      bucketsCommentLine: "// Buckets: layout | spacing",
    });

    expect(analyzeJson).toContain('"schemaVersion":1');
    expect(syncJson).toContain('"write":true');
    expect(syncJson).not.toContain("previewPlans");
    expect(groupJson).toContain('"primaryLine":"cn(\\"flex\\", \\"gap-2\\")"');
  });

  it("returns non-zero when hook error exists and prints error line", () => {
    const logger = { out: vi.fn(), err: vi.fn() };
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
