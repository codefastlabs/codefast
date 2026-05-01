import { Command } from "commander";
import { AppError } from "#/shell/domain/errors.domain";
import { CommanderCliHostAdapter } from "#/shell/infrastructure/commander/commander-cli-host.adapter";
import { MirrorCommand } from "#/domains/mirror/presentation/cli/mirror.command";
import type { CliLoggerPort } from "#/shell/application/ports/outbound/cli-logger.port";
import type { CliRuntimePort } from "#/shell/application/ports/outbound/cli-runtime.port";
import type { PrepareMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/prepare-mirror-sync.port";
import type { RunMirrorSyncPort } from "#/domains/mirror/application/ports/inbound/run-mirror-sync.port";
import { err } from "#/shell/domain/result.model";
import { createShellCliTestGraph } from "#/tests/support/cli-shell-test-deps";

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

type MirrorDeps = {
  logger: ReturnType<typeof createLoggerMock>;
  runtime: ReturnType<typeof createRuntimeMock>;
  prepareMirrorSync: PrepareMirrorSyncPort & {
    execute: ReturnType<typeof vi.fn<PrepareMirrorSyncPort["execute"]>>;
  };
  runMirrorSync: RunMirrorSyncPort & {
    execute: ReturnType<typeof vi.fn<RunMirrorSyncPort["execute"]>>;
  };
};

function createDeps(): MirrorDeps {
  return {
    logger: createLoggerMock(),
    runtime: createRuntimeMock(),
    prepareMirrorSync: {
      execute: vi.fn<PrepareMirrorSyncPort["execute"]>(async () => ({
        ok: true,
        value: {
          rootDir: "/tmp/workspace",
          config: { mirror: { skipPackages: [] } },
          packageFilter: "packages/a",
          globals: { color: false },
        },
      })),
    },
    runMirrorSync: {
      execute: vi.fn<RunMirrorSyncPort["execute"]>(async () => ({
        ok: true,
        value: {
          packagesFound: 1,
          packagesProcessed: 1,
          packagesSkipped: 0,
          packagesErrored: 0,
          totalExports: 1,
          totalJsModules: 1,
          totalCssExports: 0,
          packageDetails: [],
        },
      })),
    },
  };
}

function createCommandAndProgram(deps: MirrorDeps): { command: MirrorCommand; program: Command } {
  const shell = createShellCliTestGraph(deps.logger);
  const command = new MirrorCommand(
    deps.runtime,
    deps.prepareMirrorSync,
    deps.runMirrorSync,
    shell.globalCliOptions,
    shell.schemaValidation,
    shell.cliExecutor,
  );
  const program = new Command();
  program.option("--no-color", "Disable ANSI color output");
  new CommanderCliHostAdapter(program).registerRoot(command.definition);
  return { command, program };
}

describe("MirrorCommand integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it("runs mirror sync and forwards parsed options to use case", async () => {
    const deps = createDeps();
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(
      ["node", "codefast", "--no-color", "mirror", "sync", "packages/a", "--json", "--verbose"],
      { from: "node" },
    );

    expect(deps.prepareMirrorSync.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        currentWorkingDirectory: "/tmp/workspace",
        packageArg: "packages/a",
      }),
    );
    expect(deps.runMirrorSync.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        rootDir: "/tmp/workspace",
        packageFilter: "packages/a",
        json: true,
        verbose: true,
        noColor: true,
      }),
    );
    expect(process.exitCode).toBe(0);
  });

  it("maps package processing errors to non-zero exit code", async () => {
    const deps = createDeps();
    deps.runMirrorSync.execute.mockResolvedValue({
      ok: true,
      value: {
        packagesFound: 1,
        packagesProcessed: 1,
        packagesSkipped: 0,
        packagesErrored: 1,
        totalExports: 0,
        totalJsModules: 0,
        totalCssExports: 0,
        packageDetails: [],
      },
    });
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "mirror", "sync"], { from: "node" });
    expect(process.exitCode).toBe(1);
  });

  it("stops before prelude when global option shape is invalid", async () => {
    const deps = createDeps();
    const shell = createShellCliTestGraph(deps.logger);

    vi.spyOn(shell.globalCliOptions, "parseGlobalCliOptions").mockReturnValue(
      err(new AppError("VALIDATION_ERROR", "invalid global options")),
    );

    const command = new MirrorCommand(
      deps.runtime,
      deps.prepareMirrorSync,
      deps.runMirrorSync,
      shell.globalCliOptions,
      shell.schemaValidation,
      shell.cliExecutor,
    );

    const program = new Command();
    program.option("--no-color", "Disable ANSI color output");
    new CommanderCliHostAdapter(program).registerRoot(command.definition);

    await program.parseAsync(["node", "codefast", "mirror", "sync"], { from: "node" });

    expect(deps.prepareMirrorSync.execute).not.toHaveBeenCalled();
    expect(deps.logger.err).toHaveBeenCalledWith(expect.stringContaining("[VALIDATION_ERROR]"));
  });

  it("stops when prelude fails", async () => {
    const deps = createDeps();
    deps.prepareMirrorSync.execute.mockResolvedValue({
      ok: false,
      error: new AppError("NOT_FOUND", "missing root"),
    });
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "mirror", "sync"], { from: "node" });

    expect(deps.runMirrorSync.execute).not.toHaveBeenCalled();
    expect(deps.logger.err).toHaveBeenCalledWith("[NOT_FOUND] missing root");
  });
});
