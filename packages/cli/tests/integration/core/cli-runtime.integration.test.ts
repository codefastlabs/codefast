import { Command } from "commander";
import { AppError } from "#/lib/core/domain/errors.domain";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_USAGE } from "#/lib/core/domain/cli-exit-codes.domain";
import {
  consumeCliAppError,
  runCliResultAsync,
} from "#/lib/core/presentation/cli-executor.presenter";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";

type LoggerStub = CliLogger & {
  out: ReturnType<typeof vi.fn<(line: string) => void>>;
  err: ReturnType<typeof vi.fn<(line: string) => void>>;
};

function createLogger(): LoggerStub {
  return {
    out: vi.fn<(line: string) => void>(),
    err: vi.fn<(line: string) => void>(),
  };
}

describe("cli runtime + executor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.exitCode = undefined;
    delete process.env.CODEFAST_VERBOSE;
    process.env.NODE_ENV = "test";
  });

  it("consumes validation errors with usage exit code", () => {
    const logger = createLogger();
    const result = consumeCliAppError(
      logger,
      { ok: false, error: new AppError("VALIDATION_ERROR", "invalid args") },
      { successMessage: "ok" },
    );

    expect(result).toBe(false);
    expect(process.exitCode).toBe(CLI_EXIT_USAGE);
    expect(logger.err).toHaveBeenCalledWith("[VALIDATION_ERROR] invalid args");
    expect(logger.out).not.toHaveBeenCalled();
  });

  it("prints infra stack only when verbose diagnostics is enabled", () => {
    const logger = createLogger();
    const cause = new Error("boom");
    cause.stack = "stack-trace";

    process.env.CODEFAST_VERBOSE = "1";
    consumeCliAppError(logger, {
      ok: false,
      error: new AppError("INFRA_FAILURE", "infra broken", cause),
    });

    expect(process.exitCode).toBe(CLI_EXIT_GENERAL_ERROR);
    expect(logger.err).toHaveBeenNthCalledWith(1, "[INFRA_FAILURE] infra broken");
    expect(logger.err).toHaveBeenNthCalledWith(2, "stack-trace");
  });

  it("sets success exit code from async result handler", async () => {
    const logger = createLogger();
    await runCliResultAsync(
      logger,
      Promise.resolve({ ok: true, value: { total: 3 } }),
      async ({ total }) => total,
    );

    expect(process.exitCode).toBe(3);
    expect(logger.err).not.toHaveBeenCalled();
  });

  it("returns 0 when success callback does not return code", async () => {
    const logger = createLogger();
    await runCliResultAsync(logger, Promise.resolve({ ok: true, value: { done: true } }), () => {});
    expect(process.exitCode).toBe(0);
  });

  it("runCli initializes container in non-production and disposes always", async () => {
    const validate = vi.fn();
    const initializeAsync = vi.fn(async () => undefined);
    const dispose = vi.fn(async () => undefined);
    const register = vi.fn((program: Command) => {
      program.command("ok").action(() => {
        process.exitCode = "7" as unknown as number;
      });
    });

    vi.doMock("#/lib/bootstrap/composition-root", () => ({
      createCliRuntimeContainer: () => ({ validate, initializeAsync, dispose }),
      resolveCliCommands: () => [{ register }],
    }));

    const { runCli } = await import("#/program");
    const exitCode = await runCli(["node", "codefast", "ok"]);

    expect(exitCode).toBe(7);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(initializeAsync).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("skips validation in production and still disposes on parse failure", async () => {
    process.env.NODE_ENV = "production";
    const validate = vi.fn();
    const initializeAsync = vi.fn(async () => undefined);
    const dispose = vi.fn(async () => undefined);

    vi.doMock("#/lib/bootstrap/composition-root", () => ({
      createCliRuntimeContainer: () => ({ validate, initializeAsync, dispose }),
      resolveCliCommands: () => [],
    }));

    const { runCli } = await import("#/program");
    await expect(runCli(["node", "codefast", "unknown-command"])).rejects.toBeInstanceOf(Error);

    expect(validate).not.toHaveBeenCalled();
    expect(initializeAsync).not.toHaveBeenCalled();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
