import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { createAuditCommand } from "#/audit/command";
import { logger } from "#/core/logger";

let fixtureDir: string;
let cleanDoc: string;

beforeAll(() => {
  fixtureDir = mkdtempSync(path.join(tmpdir(), "codefast-audit-cmd-"));
  cleanDoc = path.join(fixtureDir, "guide.md");
  writeFileSync(cleanDoc, ["# Title", "", "[back to top](#title)"].join("\n"));
});

afterAll(() => {
  rmSync(fixtureDir, { recursive: true, force: true });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Drives the real Commander tree in-process so the descriptor runner (prepare → parse → run → report →
// exit) is exercised end to end, capturing what it prints and the exit code it records.
async function runAudit(args: Array<string>): Promise<{ exitCode: number; out: string }> {
  const previousExitCode = process.exitCode;
  process.exitCode = undefined;
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  try {
    await createAuditCommand().parseAsync(["node", "audit", ...args]);
    return {
      exitCode: typeof process.exitCode === "number" ? process.exitCode : 0,
      out: spy.mock.calls.map((call) => String(call[0])).join("\n"),
    };
  } finally {
    process.exitCode = previousExitCode;
  }
}

describe("audit command runner", () => {
  it("runs a clean links scan and prints a machine summary with exit 0 for --json", async () => {
    const { exitCode, out } = await runAudit(["links", cleanDoc, "--json"]);

    expect(exitCode).toBe(0);
    expect(JSON.parse(out)).toMatchObject({ schemaVersion: 1, ok: true });
  });

  it("runs a clean links scan and prints the human summary without --json", async () => {
    const { exitCode, out } = await runAudit(["links", cleanDoc]);

    expect(exitCode).toBe(0);
    expect(out).toContain("✓");
    expect(out).toContain("all resolve");
  });
});
