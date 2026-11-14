import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CommandSpec } from "#core/command";
import { createCommand, deriveContext } from "#core/command";
import { AppError } from "#core/errors";
import { err, ok } from "#core/result";
import { refuseColor } from "#core/style";
import { createCommandContext } from "#tests/unit/support/command-context";
import { captureLogger } from "#tests/unit/support/logger-capture";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");

function project(config?: object): ReturnType<typeof createMemoryFilesystem> {
  return createMemoryFilesystem({
    [path.join(root, "package.json")]: '{"name":"solo"}',
    [path.join(root, "src/a.ts")]: "",
    ...(config === undefined ? {} : { [path.join(root, "codefast.config.json")]: JSON.stringify(config) }),
  });
}

interface Echo {
  readonly target: string;
  readonly dryRun: boolean;
  readonly passed: boolean;
}

function echoSpec(overrides: Partial<CommandSpec<Echo, "dryRun">> = {}): CommandSpec<Echo, "dryRun"> {
  return {
    name: "echo:run",
    description: "Echo the context",
    targetHelp: "anything",
    flags: { dryRun: "Write nothing" },
    run: async (context) => ok({ target: context.target.relativePath, dryRun: context.flags.dryRun, passed: true }),
    verdict: (report) => (report.passed ? "pass" : "fail"),
    present: (report, context) => {
      void context.elapsedSeconds;
      void report;
    },
    ...overrides,
  };
}

async function run(
  spec: CommandSpec<Echo, "dryRun">,
  args: Array<string>,
  fs = project().fs,
): Promise<{ exitCode: typeof process.exitCode; out: string; err: string }> {
  const printed = captureLogger();
  await createCommand(spec, fs).parseAsync(args, { from: "user" });
  return { exitCode: process.exitCode, out: printed.out(), err: printed.err() };
}

let previousExitCode: typeof process.exitCode;

beforeEach(() => {
  previousExitCode = process.exitCode;
  process.exitCode = undefined;
  refuseColor(true);
  vi.spyOn(process, "cwd").mockReturnValue(path.join(root, "src"));
});

afterEach(() => {
  process.exitCode = previousExitCode;
  refuseColor(false);
  vi.restoreAllMocks();
});

describe("the command pipeline", () => {
  it("prints one JSON document carrying the command, the root, the target and the report", async () => {
    const { exitCode, out } = await run(echoSpec(), ["a.ts", "--dry-run", "--json"]);

    expect(exitCode).toBe(0);
    expect(JSON.parse(out)).toMatchObject({
      schemaVersion: 3,
      command: "echo:run",
      ok: true,
      rootDir: root,
      target: "src/a.ts",
      result: { target: "src/a.ts", dryRun: true },
    });
  });

  it("presents the report to a human, with the elapsed time", async () => {
    const present = vi.fn();

    const { exitCode } = await run(echoSpec({ present }), []);

    expect(exitCode).toBe(0);
    expect(present).toHaveBeenCalledWith(
      { target: ".", dryRun: false, passed: true },
      expect.objectContaining({ elapsedSeconds: expect.any(Number) }),
    );
  });

  it("maps a failing verdict to exit 1", async () => {
    const { exitCode } = await run(echoSpec({ verdict: () => "fail" }), []);

    expect(exitCode).toBe(1);
  });

  it("reports an error the run returns as exit 2, as JSON under --json", async () => {
    const failing = echoSpec({ run: async () => err(new AppError("VALIDATION_ERROR", "bad input")) });

    const human = await run(failing, []);
    const machine = await run(failing, ["--json"]);

    expect(human).toMatchObject({ exitCode: 2, err: "[VALIDATION_ERROR] bad input" });
    expect(JSON.parse(machine.out)).toEqual({
      schemaVersion: 3,
      command: "echo:run",
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "bad input" },
    });
  });

  it("refuses a target that does not exist before the run starts", async () => {
    const runSpy = vi.fn();

    const { exitCode, err: printed } = await run(echoSpec({ run: runSpy }), ["missing.ts"]);

    expect(exitCode).toBe(2);
    expect(printed).toContain("[NOT_FOUND]");
    expect(runSpy).not.toHaveBeenCalled();
  });
});

describe("deriveContext", () => {
  it("keeps a target the command line named, and otherwise resolves the configured one", async () => {
    const { fs } = project();
    const named = await createCommandContext(fs, { cwd: root, target: "src/a.ts" });
    const defaulted = await createCommandContext(fs, { cwd: root });

    const kept = deriveContext(named, () => "src", { fix: true });
    const configured = deriveContext(defaulted, () => "src", { fix: false });

    expect(kept.ok && kept.value).toMatchObject({ target: { relativePath: "src/a.ts" }, flags: { fix: true } });
    expect(configured.ok && configured.value.target.relativePath).toBe("src");
  });
});
