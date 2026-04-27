import { Command } from "commander";
import { AppError } from "#/lib/core/domain/errors.domain";
import { MirrorCommand } from "#/lib/mirror/adapters/primary/cli/mirror.command";

type MirrorDeps = {
  logger: { out: ReturnType<typeof vi.fn>; err: ReturnType<typeof vi.fn> };
  runtime: { cwd: ReturnType<typeof vi.fn> };
  prepareMirrorSync: { execute: ReturnType<typeof vi.fn> };
  runMirrorSync: { execute: ReturnType<typeof vi.fn> };
};

function createDeps(): MirrorDeps {
  return {
    logger: { out: vi.fn(), err: vi.fn() },
    runtime: { cwd: vi.fn(() => "/tmp/workspace") },
    prepareMirrorSync: {
      execute: vi.fn(async () => ({
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
      execute: vi.fn(async () => ({
        ok: true,
        value: {
          packagesFound: 1,
          packagesProcessed: 1,
          packagesSkipped: 0,
          packagesErrored: 0,
          totalExports: 1,
          totalJsModules: 1,
          totalCssExports: 0,
          elapsedSeconds: 0.01,
        },
      })),
    },
  };
}

function createCommandAndProgram(deps: MirrorDeps): { command: MirrorCommand; program: Command } {
  const command = new MirrorCommand(
    deps.logger,
    deps.runtime,
    deps.prepareMirrorSync,
    deps.runMirrorSync,
  );
  const program = new Command();
  program.option("--no-color", "Disable ANSI color output");
  command.register(program);
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
        elapsedSeconds: 0.1,
      },
    });
    const { program } = createCommandAndProgram(deps);

    await program.parseAsync(["node", "codefast", "mirror", "sync"], { from: "node" });
    expect(process.exitCode).toBe(1);
  });

  it("stops before prelude when global option shape is invalid", async () => {
    const deps = createDeps();
    const { command } = createCommandAndProgram(deps);

    await command.execute(undefined, {}, {
      optsWithGlobals: () => ({ color: "invalid" }),
    } as unknown as Command);

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
