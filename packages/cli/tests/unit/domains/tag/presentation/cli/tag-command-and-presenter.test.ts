import { Command } from "commander";
import { AppError } from "#/shell/domain/errors.domain";
import { TagCommand } from "#/domains/tag/presentation/cli/tag.command";
import type { PrepareTagSyncPort } from "#/domains/tag/application/ports/inbound/prepare-tag-sync.port";
import type { RunTagSyncPort } from "#/domains/tag/application/ports/inbound/run-tag-sync.port";
import type { PresentTagSyncResultPresenter as PresentTagSyncResultPresenterPort } from "#/domains/tag/application/ports/presenting/present-tag-sync-result.presenter";
import type { PresentTagSyncProgressPresenter as PresentTagSyncProgressPresenterPort } from "#/domains/tag/application/ports/presenting/present-tag-sync-progress.presenter";
import { PresentTagSyncResultPresenter } from "#/domains/tag/presentation/presenters/present-tag-sync-result.presenter";
import { PresentTagSyncProgressPresenter } from "#/domains/tag/presentation/presenters/present-tag-sync-progress.presenter";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";
import type { TagSyncResult } from "#/domains/tag/domain/types.domain";

function createLoggerMock(): CliLoggerPort & {
  out: ReturnType<typeof vi.fn<(line: string) => void>>;
  err: ReturnType<typeof vi.fn<(line: string) => void>>;
} {
  return {
    out: vi.fn<(line: string) => void>(),
    err: vi.fn<(line: string) => void>(),
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
  prepareTagSync: PrepareTagSyncPort & {
    execute: ReturnType<typeof vi.fn<PrepareTagSyncPort["execute"]>>;
  };
  runTagSync: RunTagSyncPort & {
    execute: ReturnType<typeof vi.fn<RunTagSyncPort["execute"]>>;
  };
  tagProgressPresenter: PresentTagSyncProgressPresenterPort & {
    onTargetStarted: ReturnType<
      typeof vi.fn<PresentTagSyncProgressPresenterPort["onTargetStarted"]>
    >;
    onTargetCompleted: ReturnType<
      typeof vi.fn<PresentTagSyncProgressPresenterPort["onTargetCompleted"]>
    >;
  };
  presenter: PresentTagSyncResultPresenterPort & {
    present: ReturnType<typeof vi.fn<PresentTagSyncResultPresenterPort["present"]>>;
  };
};

function createDeps(): TagDeps {
  return {
    logger: createLoggerMock(),
    runtime: createRuntimeMock(),
    prepareTagSync: {
      execute: vi.fn<PrepareTagSyncPort["execute"]>(async () => ({
        ok: true,
        value: {
          rootDir: "/tmp/workspace",
          config: { tag: { skipPackages: [] } },
          resolvedTargetPath: "packages/a/src",
        },
      })),
    },
    runTagSync: {
      execute: vi.fn<RunTagSyncPort["execute"]>(async () => ({
        ok: true,
        value: createTagResult(),
      })),
    },
    tagProgressPresenter: {
      onTargetStarted: vi.fn<PresentTagSyncProgressPresenterPort["onTargetStarted"]>(),
      onTargetCompleted: vi.fn<PresentTagSyncProgressPresenterPort["onTargetCompleted"]>(),
    },
    presenter: {
      present: vi.fn<PresentTagSyncResultPresenterPort["present"]>(() => 0),
    },
  };
}

import { createShellCliTestGraph } from "#/tests/support/cli-shell-test-deps";
import { CommanderCliHostAdapter } from "#/shell/infrastructure/commander/commander-cli-host.adapter";

function createCommandAndProgram(deps: TagDeps): { command: TagCommand; program: Command } {
  const shell = createShellCliTestGraph(deps.logger);
  const command = new TagCommand(
    deps.logger,
    deps.runtime,
    deps.prepareTagSync,
    deps.runTagSync,
    deps.tagProgressPresenter,
    deps.presenter,
    shell.schemaValidation,
    shell.cliExecutor,
  );
  const program = new Command();
  new CommanderCliHostAdapter(program).registerRoot(command.definition);
  return { command, program };
}

describe("TagCommand + tag presenter", () => {
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
      expect.objectContaining({ write: true, json: false, listener: deps.tagProgressPresenter }),
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
    const logger = createLoggerMock();
    const progress = new PresentTagSyncProgressPresenter(logger);
    const target = {
      targetPath: "/tmp/workspace/a",
      rootRelativeTargetPath: "packages/a/src",
      source: "workspace-package-selected-src" as const,
      packageDir: null,
      packageName: "@scope/a",
    };
    progress.onTargetStarted(target);
    progress.onTargetCompleted(target, {
      target,
      targetExists: true,
      runError: null,
      result: {
        version: "1.0.0",
        filesScanned: 1,
        filesChanged: 2,
        taggedDeclarations: 3,
        fileResults: [],
      },
    });

    expect(logger.out).toHaveBeenNthCalledWith(1, expect.stringContaining("Processing @scope/a"));
    expect(logger.out).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("Done @scope/a (2 changes)"),
    );
  });

  it("returns non-zero and warning lines from presenter when result has errors", () => {
    const logger = createLoggerMock();
    const presenter = new PresentTagSyncResultPresenter(logger);
    const exitCode = presenter.present(
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
    const presenter = new PresentTagSyncResultPresenter(logger);
    const exitCode = presenter.present(
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
