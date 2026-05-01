import { Command } from "commander";
import { AppError } from "#/shell/domain/errors.domain";
import { TagCommand } from "#/domains/tag/presentation/cli/tag.command";
import type { PrepareTagSyncUseCase } from "#/domains/tag/application/ports/inbound/prepare-tag-sync.port";
import type { RunTagSyncUseCase } from "#/domains/tag/application/ports/inbound/run-tag-sync.port";
import type { PresentTagSyncResultPresenter } from "#/domains/tag/application/ports/presenting/present-tag-sync-result.port";
import {
  formatProgress,
  presentTagSyncCliResult,
} from "#/domains/tag/presentation/presenters/tag-sync.presenter";
import type { CliLogger } from "#/shell/application/ports/outbound/cli-io.port";
import type { CliRuntime } from "#/shell/application/ports/outbound/cli-runtime.port";
import type { TagProgressListener, TagSyncResult } from "#/domains/tag/domain/types.domain";

function createLoggerMock(): CliLogger & {
  out: ReturnType<typeof vi.fn<(line: string) => void>>;
  err: ReturnType<typeof vi.fn<(line: string) => void>>;
} {
  return {
    out: vi.fn<(line: string) => void>(),
    err: vi.fn<(line: string) => void>(),
  };
}

function createRuntimeMock(): CliRuntime & {
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

function createTagResult(overrides?: Partial<TagSyncResult>): TagSyncResult {
  return {
    mode: "applied",
    selectedTargets: [
      {
        targetPath: "/tmp/workspace/packages/a/src",
        rootRelativeTargetPath: "packages/a/src",
        source: "workspace-package-selected-src",
        packageDir: "/tmp/workspace/packages/a",
        packageName: "@scope/a",
      },
    ],
    resolvedTargets: [],
    skippedPackages: [],
    targetResults: [
      {
        target: {
          targetPath: "/tmp/workspace/packages/a/src",
          rootRelativeTargetPath: "packages/a/src",
          source: "workspace-package-selected-src",
          packageDir: "/tmp/workspace/packages/a",
          packageName: "@scope/a",
        },
        targetExists: true,
        runError: null,
        result: {
          version: "1.0.0",
          filesScanned: 1,
          filesChanged: 1,
          taggedDeclarations: 1,
          fileResults: [],
        },
      },
    ],
    filesScanned: 1,
    filesChanged: 1,
    taggedDeclarations: 1,
    versionSummary: "1.0.0",
    distinctVersions: ["1.0.0"],
    modifiedFiles: ["packages/a/src/index.ts"],
    hookError: null,
    ...(overrides ?? {}),
  };
}

type TagDeps = {
  logger: ReturnType<typeof createLoggerMock>;
  runtime: ReturnType<typeof createRuntimeMock>;
  prepareTagSync: PrepareTagSyncUseCase & {
    execute: ReturnType<typeof vi.fn<PrepareTagSyncUseCase["execute"]>>;
  };
  runTagSync: RunTagSyncUseCase & {
    execute: ReturnType<typeof vi.fn<RunTagSyncUseCase["execute"]>>;
  };
  tagProgressListener: TagProgressListener & {
    onTargetStarted: ReturnType<typeof vi.fn<TagProgressListener["onTargetStarted"]>>;
    onTargetCompleted: ReturnType<typeof vi.fn<TagProgressListener["onTargetCompleted"]>>;
  };
  presenter: PresentTagSyncResultPresenter & {
    present: ReturnType<typeof vi.fn<PresentTagSyncResultPresenter["present"]>>;
  };
};

function createDeps(): TagDeps {
  return {
    logger: createLoggerMock(),
    runtime: createRuntimeMock(),
    prepareTagSync: {
      execute: vi.fn<PrepareTagSyncUseCase["execute"]>(async () => ({
        ok: true,
        value: {
          rootDir: "/tmp/workspace",
          config: { tag: { skipPackages: [] } },
          resolvedTargetPath: "packages/a/src",
        },
      })),
    },
    runTagSync: {
      execute: vi.fn<RunTagSyncUseCase["execute"]>(async () => ({
        ok: true,
        value: createTagResult(),
      })),
    },
    tagProgressListener: {
      onTargetStarted: vi.fn<TagProgressListener["onTargetStarted"]>(),
      onTargetCompleted: vi.fn<TagProgressListener["onTargetCompleted"]>(),
    },
    presenter: {
      present: vi.fn<PresentTagSyncResultPresenter["present"]>(() => 0),
    },
  };
}

import { createShellCliTestGraph } from "#/tests/support/cli-shell-test-deps";
import { CommanderCliHostAdapter } from "#/shell/adapters/commander/commander-cli-host.adapter";

function createCommandAndProgram(deps: TagDeps): { command: TagCommand; program: Command } {
  const shell = createShellCliTestGraph(deps.logger);
  const command = new TagCommand(
    deps.logger,
    deps.runtime,
    deps.prepareTagSync,
    deps.runTagSync,
    deps.tagProgressListener,
    deps.presenter,
    shell.schemaValidation,
    shell.cliExecutor,
  );
  const program = new Command();
  new CommanderCliHostAdapter(program).registerRoot(command.definition);
  return { command, program };
}

describe("TagCommand + tag presenter integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it("executes JSON mode with listener disabled and exit code mapping", async () => {
    const deps = createDeps();
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "tag", "packages/a/src", "--json", "--dry-run"], {
      from: "node",
    });

    expect(deps.runTagSync.execute).toHaveBeenCalledWith(
      expect.objectContaining({ write: false, json: true, listener: undefined }),
    );
    expect(deps.logger.out).toHaveBeenCalledWith(expect.stringContaining('"schemaVersion":1'));
    expect(deps.runtime.setExitCode).toHaveBeenCalledWith(0);
  });

  it("executes human mode with progress listener and presenter output", async () => {
    const deps = createDeps();
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "annotate", "packages/a/src"], { from: "node" });

    expect(deps.runTagSync.execute).toHaveBeenCalledWith(
      expect.objectContaining({ write: true, json: false, listener: deps.tagProgressListener }),
    );
    expect(deps.presenter.present).toHaveBeenCalledTimes(1);
    expect(deps.runtime.setExitCode).toHaveBeenCalledWith(0);
  });

  it("stops when prelude fails", async () => {
    const deps = createDeps();
    deps.prepareTagSync.execute.mockResolvedValue({
      ok: false,
      error: new AppError("NOT_FOUND", "target missing"),
    });
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "tag"], { from: "node" });

    expect(deps.runTagSync.execute).not.toHaveBeenCalled();
    expect(deps.logger.err).toHaveBeenCalledWith("[NOT_FOUND] target missing");
  });

  it("formats progress events for started and completed states", () => {
    const started = formatProgress({
      type: "target-started",
      target: {
        targetPath: "/tmp/workspace/a",
        rootRelativeTargetPath: "packages/a/src",
        source: "workspace-package-selected-src",
        packageDir: null,
        packageName: "@scope/a",
      },
    });
    const completed = formatProgress({
      type: "target-completed",
      target: {
        targetPath: "/tmp/workspace/a",
        rootRelativeTargetPath: "packages/a/src",
        source: "workspace-package-selected-src",
        packageDir: null,
        packageName: "@scope/a",
      },
      result: {
        target: {
          targetPath: "/tmp/workspace/a",
          rootRelativeTargetPath: "packages/a/src",
          source: "workspace-package-selected-src",
          packageDir: null,
          packageName: "@scope/a",
        },
        targetExists: true,
        runError: null,
        result: {
          version: "1.0.0",
          filesScanned: 1,
          filesChanged: 2,
          taggedDeclarations: 3,
          fileResults: [],
        },
      },
    });

    expect(started).toContain("Processing @scope/a");
    expect(completed).toContain("Done @scope/a (2 changes)");
  });

  it("returns non-zero and warning lines from presenter when result has errors", () => {
    const logger = createLoggerMock();
    const exitCode = presentTagSyncCliResult(
      logger,
      createTagResult({
        targetResults: [
          {
            target: {
              targetPath: "/tmp/workspace/a",
              rootRelativeTargetPath: "packages/a/src",
              source: "workspace-package-selected-src",
              packageDir: null,
              packageName: "@scope/a",
            },
            targetExists: true,
            runError: "parse error",
            result: null,
          },
        ],
        skippedPackages: ["@scope/b"],
      }),
      "/tmp/workspace",
    );

    expect(exitCode).toBe(1);
    expect(logger.out).toHaveBeenCalled();
    expect(logger.err).toHaveBeenCalledWith(expect.stringContaining("Warnings & Errors"));
  });

  it("returns non-zero for empty target list", () => {
    const logger = createLoggerMock();
    const exitCode = presentTagSyncCliResult(
      logger,
      createTagResult({
        selectedTargets: [],
        targetResults: [],
      }),
      "/tmp/workspace",
    );
    expect(exitCode).toBe(1);
    expect(logger.err).toHaveBeenCalledWith(expect.stringContaining("No packages found"));
  });
});
