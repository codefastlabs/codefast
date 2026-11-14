import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runCli } from "#cli";
import { paint, refuseColor } from "#core/style";

let previousExitCode: typeof process.exitCode;

beforeEach(() => {
  previousExitCode = process.exitCode;
  process.exitCode = undefined;
  // Commander writes help and usage errors straight to the process streams.
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});

afterEach(() => {
  process.exitCode = previousExitCode;
  refuseColor(false);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("runCli", () => {
  it("resolves 0 for --help, --version, and no command at all", async () => {
    expect(await runCli(["node", "codefast", "--help"])).toBe(0);
    expect(await runCli(["node", "codefast", "--version"])).toBe(0);
    expect(await runCli(["node", "codefast"])).toBe(0);
  });

  it("resolves 2 for an unknown command and an unknown option", async () => {
    expect(await runCli(["node", "codefast", "definitely-not-a-command"])).toBe(2);
    process.exitCode = undefined;
    expect(await runCli(["node", "codefast", "audit:links", "--definitely-not-an-option"])).toBe(2);
  });

  it("refuses color for the run --no-color starts", async () => {
    vi.stubEnv("FORCE_COLOR", "1");

    await runCli(["node", "codefast", "--no-color", "audit:links", "definitely-missing"]);

    expect(paint("red", "x")).toBe("x");
  });
});
