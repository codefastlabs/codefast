import { Command } from "commander";
import { AppError } from "#/lib/core/domain/errors.domain";
import { ArrangeCommand } from "#/lib/arrange/adapters/primary/cli/arrange.command";

function createArrangeRunResult(overrides?: Partial<Record<string, unknown>>) {
  return {
    filePaths: ["a.tsx"],
    modifiedFiles: [],
    totalFound: 2,
    totalChanged: 1,
    hookError: null,
    previewPlans: [{ filePath: "a.tsx", plannedGroupEdits: [] }],
    ...(overrides ?? {}),
  };
}

function createArrangeReport() {
  return {
    files: 1,
    cnCallExpressions: 1,
    tvCallExpressions: 1,
    cnInsideTvCalls: [{ file: "a.tsx", line: 1, argCount: 2, preview: "cn(...)" }],
    longCnStringLiterals: [{ file: "a.tsx", line: 1, tokenCount: 20, preview: "flex gap-2 ..." }],
    longTvStringLiterals: [{ file: "a.tsx", line: 2, tokenCount: 22, preview: "base: ..." }],
    longJsxClassNameLiterals: [
      { file: "a.tsx", line: 3, tokenCount: 21, preview: "className=..." },
    ],
  };
}

type ArrangeDeps = {
  logger: { out: ReturnType<typeof vi.fn>; err: ReturnType<typeof vi.fn> };
  runtime: { cwd: ReturnType<typeof vi.fn>; setExitCode: ReturnType<typeof vi.fn> };
  prepareWorkspace: { execute: ReturnType<typeof vi.fn> };
  analyzeDirectory: { execute: ReturnType<typeof vi.fn> };
  runArrangeSync: { execute: ReturnType<typeof vi.fn> };
  suggestCnGroups: { execute: ReturnType<typeof vi.fn> };
  presentAnalyzeReport: { present: ReturnType<typeof vi.fn> };
  groupFilePreview: { printGroupFilePreviewFromWork: ReturnType<typeof vi.fn> };
};

function createDeps(): ArrangeDeps {
  return {
    logger: { out: vi.fn(), err: vi.fn() },
    runtime: { cwd: vi.fn(() => "/tmp/workspace"), setExitCode: vi.fn() },
    prepareWorkspace: {
      execute: vi.fn(async () => ({
        ok: true,
        value: { resolvedTarget: "/tmp/workspace/src", rootDir: "/tmp/workspace", config: {} },
      })),
    },
    analyzeDirectory: { execute: vi.fn(() => ({ ok: true, value: createArrangeReport() })) },
    runArrangeSync: { execute: vi.fn(async () => ({ ok: true, value: createArrangeRunResult() })) },
    suggestCnGroups: {
      execute: vi.fn(() => ({
        primaryLine: 'cn("flex gap-2", "rounded-md")',
        bucketsCommentLine: "// Buckets: layout | shape",
      })),
    },
    presentAnalyzeReport: { present: vi.fn() },
    groupFilePreview: { printGroupFilePreviewFromWork: vi.fn() },
  };
}

function createCommandAndProgram(deps: ArrangeDeps): { command: ArrangeCommand; program: Command } {
  const command = new ArrangeCommand(
    deps.logger,
    deps.runtime,
    deps.prepareWorkspace,
    deps.analyzeDirectory,
    deps.runArrangeSync,
    deps.suggestCnGroups,
    deps.presentAnalyzeReport,
    deps.groupFilePreview,
  );
  const program = new Command();
  command.register(program);
  return { command, program };
}

describe("ArrangeCommand integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it("prints analyze JSON when --json is provided", async () => {
    const deps = createDeps();
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "arrange", "analyze", "--json"], {
      from: "node",
    });

    expect(deps.presentAnalyzeReport.present).not.toHaveBeenCalled();
    expect(deps.logger.out).toHaveBeenCalledWith(expect.stringContaining('"schemaVersion":1'));
  });

  it("prints analyze human report by default", async () => {
    const deps = createDeps();
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "arrange", "analyze"], { from: "node" });

    expect(deps.presentAnalyzeReport.present).toHaveBeenCalledTimes(1);
  });

  it("prints preview plans and presenter output in preview mode", async () => {
    const deps = createDeps();
    deps.runArrangeSync.execute.mockResolvedValue({
      ok: true,
      value: createArrangeRunResult({
        previewPlans: [
          { filePath: "x.tsx", plannedGroupEdits: [] },
          { filePath: "y.tsx", plannedGroupEdits: [] },
        ],
        totalChanged: 0,
      }),
    });
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "arrange", "preview", "src"], { from: "node" });

    expect(deps.groupFilePreview.printGroupFilePreviewFromWork).toHaveBeenCalledTimes(2);
    expect(deps.runtime.setExitCode).toHaveBeenCalledWith(0);
  });

  it("prints apply JSON and sets non-zero when hook fails", async () => {
    const deps = createDeps();
    deps.runArrangeSync.execute.mockResolvedValue({
      ok: true,
      value: createArrangeRunResult({ hookError: "hook failed", totalChanged: 0 }),
    });
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "arrange", "apply", "src", "--json"], {
      from: "node",
    });

    expect(deps.groupFilePreview.printGroupFilePreviewFromWork).not.toHaveBeenCalled();
    expect(deps.runtime.setExitCode).toHaveBeenCalledWith(1);
    expect(deps.logger.out).toHaveBeenCalledWith(expect.stringContaining('"ok":false'));
  });

  it("prints grouped output in plain mode and JSON mode", async () => {
    const deps = createDeps();
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "arrange", "group", "flex", "gap-2"], {
      from: "node",
    });
    await program.parseAsync(["node", "codefast", "arrange", "group", "flex", "--json"], {
      from: "node",
    });

    expect(deps.logger.out).toHaveBeenCalledWith('cn("flex gap-2", "rounded-md")');
    expect(deps.logger.out).toHaveBeenCalledWith("// Buckets: layout | shape");
    expect(deps.logger.out).toHaveBeenCalledWith(expect.stringContaining('"schemaVersion":1'));
  });

  it("stops early when workspace prelude fails", async () => {
    const deps = createDeps();
    deps.prepareWorkspace.execute.mockResolvedValue({
      ok: false,
      error: new AppError("NOT_FOUND", "workspace not found"),
    });
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "arrange", "analyze"], { from: "node" });

    expect(deps.analyzeDirectory.execute).not.toHaveBeenCalled();
    expect(deps.logger.err).toHaveBeenCalledWith("[NOT_FOUND] workspace not found");
  });
});
