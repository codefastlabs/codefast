import { Command } from "commander";
import { AppError } from "#/shell/domain/errors.domain";
import { ArrangeCommand } from "#/domains/arrange/presentation/cli/arrange.command";
import type { GroupFilePreviewPort } from "#/domains/arrange/application/ports/outbound/group-file-preview.port";
import type { AnalyzeDirectoryUseCase } from "#/domains/arrange/application/ports/inbound/analyze-directory.use-case";
import type { PrepareArrangeWorkspaceUseCase } from "#/domains/arrange/application/ports/inbound/prepare-arrange-workspace.use-case";
import type { RunArrangeSyncUseCase } from "#/domains/arrange/application/ports/inbound/run-arrange-sync.use-case";
import type { SuggestCnGroupsUseCase } from "#/domains/arrange/application/ports/inbound/suggest-cn-groups.use-case";
import type { PresentAnalyzeReportPresenter } from "#/domains/arrange/application/ports/presenting/present-analyze-report.presenter";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";
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

function createRuntimeMock(): CliRuntimePort & {
  cwd: ReturnType<typeof vi.fn<() => string>>;
  setExitCode: ReturnType<typeof vi.fn<(code: number) => void>>;
  isStdoutTty: ReturnType<typeof vi.fn<() => boolean>>;
} {
  return {
    cwd: vi.fn<() => string>(() => "/tmp/workspace"),
    setExitCode: vi.fn<(code: number) => void>(),
    isStdoutTty: vi.fn<() => boolean>(() => false),
  };
}

function createArrangeRunResult(overrides?: Partial<Record<string, unknown>>) {
  return {
    filePaths: ["a.tsx"],
    modifiedFiles: [],
    totalFound: 2,
    totalChanged: 1,
    hookError: null,
    previewPlans: [createPreviewPlan("a.tsx")],
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
  logger: ReturnType<typeof createLoggerMock>;
  runtime: ReturnType<typeof createRuntimeMock>;
  prepareWorkspace: PrepareArrangeWorkspaceUseCase & {
    execute: ReturnType<typeof vi.fn<PrepareArrangeWorkspaceUseCase["execute"]>>;
  };
  analyzeDirectory: AnalyzeDirectoryUseCase & {
    execute: ReturnType<typeof vi.fn<AnalyzeDirectoryUseCase["execute"]>>;
  };
  runArrangeSync: RunArrangeSyncUseCase & {
    execute: ReturnType<typeof vi.fn<RunArrangeSyncUseCase["execute"]>>;
  };
  suggestCnGroups: SuggestCnGroupsUseCase & {
    execute: ReturnType<typeof vi.fn<SuggestCnGroupsUseCase["execute"]>>;
  };
  presentAnalyzeReport: PresentAnalyzeReportPresenter & {
    present: ReturnType<typeof vi.fn<PresentAnalyzeReportPresenter["present"]>>;
  };
  groupFilePreview: GroupFilePreviewPort & {
    printGroupFilePreviewFromWork: ReturnType<
      typeof vi.fn<GroupFilePreviewPort["printGroupFilePreviewFromWork"]>
    >;
  };
};

function createDeps(): ArrangeDeps {
  return {
    logger: createLoggerMock(),
    runtime: createRuntimeMock(),
    prepareWorkspace: {
      execute: vi.fn<PrepareArrangeWorkspaceUseCase["execute"]>(async () => ({
        ok: true,
        value: { resolvedTarget: "/tmp/workspace/src", rootDir: "/tmp/workspace", config: {} },
      })),
    },
    analyzeDirectory: {
      execute: vi.fn<AnalyzeDirectoryUseCase["execute"]>(() => ({
        ok: true,
        value: createArrangeReport(),
      })),
    },
    runArrangeSync: {
      execute: vi.fn<RunArrangeSyncUseCase["execute"]>(async () => ({
        ok: true,
        value: createArrangeRunResult(),
      })),
    },
    suggestCnGroups: {
      execute: vi.fn<SuggestCnGroupsUseCase["execute"]>(() => ({
        primaryLine: 'cn("flex gap-2", "rounded-md")',
        bucketsCommentLine: "// Buckets: layout | shape",
      })),
    },
    presentAnalyzeReport: {
      present: vi.fn<PresentAnalyzeReportPresenter["present"]>(),
    },
    groupFilePreview: {
      printGroupFilePreviewFromWork: vi.fn<GroupFilePreviewPort["printGroupFilePreviewFromWork"]>(),
    },
  };
}

import { createShellCliTestGraph } from "#/tests/support/cli-shell-test-deps";
import { CommanderCliHostAdapter } from "#/shell/adapters/commander/commander-cli-host.adapter";

function createCommandAndProgram(deps: ArrangeDeps): { command: ArrangeCommand; program: Command } {
  const shell = createShellCliTestGraph(deps.logger);
  const command = new ArrangeCommand(
    deps.logger,
    deps.runtime,
    deps.prepareWorkspace,
    deps.analyzeDirectory,
    deps.runArrangeSync,
    deps.suggestCnGroups,
    deps.presentAnalyzeReport,
    deps.groupFilePreview,
    shell.schemaValidation,
    shell.cliExecutor,
  );
  const program = new Command();
  new CommanderCliHostAdapter(program).registerRoot(command.definition);
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
        previewPlans: [createPreviewPlan("x.tsx"), createPreviewPlan("y.tsx")],
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
