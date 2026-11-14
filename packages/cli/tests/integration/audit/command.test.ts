import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { runCli } from "#cli";
import { logger } from "#core/logger";

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
    const exitCode = await runCli(["node", "codefast", ...args]);
    return {
      exitCode,
      out: spy.mock.calls.map((call) => String(call[0])).join("\n"),
    };
  } finally {
    process.exitCode = previousExitCode;
  }
}

describe("audit command runner", () => {
  it("runs a clean links scan and prints a machine summary with exit 0 for --json", async () => {
    const { exitCode, out } = await runAudit(["audit:links", cleanDoc, "--json"]);

    expect(exitCode).toBe(0);
    expect(JSON.parse(out)).toMatchObject({ schemaVersion: 2, ok: true });
  });

  it("runs a clean links scan and prints the human summary without --json", async () => {
    const { exitCode, out } = await runAudit(["audit:links", cleanDoc]);

    expect(exitCode).toBe(0);
    expect(out).toContain("✓");
    expect(out).toContain("all resolve");
  });

  it("runs an engines audit over a target holding no package and reports no floors", async () => {
    const { exitCode, out } = await runAudit(["audit:engines", fixtureDir, "--json"]);

    expect(exitCode).toBe(0);
    expect(JSON.parse(out)).toMatchObject({ ok: true, result: { floors: [], violations: [], packageCount: 0 } });
  });
});

describe("a full audit run", () => {
  let repoDir: string;

  beforeAll(() => {
    repoDir = mkdtempSync(path.join(tmpdir(), "codefast-audit-all-"));
    writeFileSync(path.join(repoDir, "package.json"), JSON.stringify({ name: "solo", private: true }));
  });

  afterAll(() => {
    rmSync(repoDir, { recursive: true, force: true });
  });

  afterEach(() => {
    rmSync(path.join(repoDir, "README.md"), { force: true });
  });

  async function runAll(
    args: Array<string>,
    cwd: string = repoDir,
  ): Promise<{ exitCode: number; out: string; err: string }> {
    vi.spyOn(process, "cwd").mockReturnValue(cwd);
    const errSpy = vi.spyOn(logger, "err").mockImplementation(() => {});
    const result = await runAudit(["audit", ...args]);
    return { ...result, err: errSpy.mock.calls.map((call) => String(call[0])).join("\n") };
  }

  it("reports every audit that ran as clean and skips rtl with no configured target", async () => {
    writeFileSync(path.join(repoDir, "README.md"), "# Solo\n");
    const { exitCode, out } = await runAll([]);

    expect(exitCode).toBe(0);
    expect(out).toContain("audit:links");
    expect(out).toContain("Skipped: no audit.rtl.target in the config");
    expect(out).toContain("✓ All 9 audits that ran are clean");
  });

  it("exits 1 and names the audit with findings", async () => {
    writeFileSync(path.join(repoDir, "README.md"), "# Solo\n\n[gone](./missing.md)\n");
    const { exitCode, out } = await runAll(["--json"]);
    const summary = JSON.parse(out) as {
      ok: boolean;
      rootDir: string;
      audits: Array<{ name: string; status: string }>;
    };

    expect(exitCode).toBe(1);
    expect(summary.ok).toBe(false);
    expect(summary.audits.find((audit) => audit.name === "links")?.status).toBe("findings");
    expect(summary.audits.find((audit) => audit.name === "rtl")?.status).toBe("skipped");
  });

  it("exits 2 when an audit cannot run, and still runs the rest", async () => {
    // A directory of its own: the config loader caches one load per directory for the life of the process.
    const configuredDir = mkdtempSync(path.join(tmpdir(), "codefast-audit-all-"));
    try {
      writeFileSync(path.join(configuredDir, "package.json"), JSON.stringify({ name: "solo", private: true }));
      writeFileSync(path.join(configuredDir, "README.md"), "# Solo\n\n[gone](./missing.md)\n");
      writeFileSync(
        path.join(configuredDir, "codefast.config.json"),
        JSON.stringify({ audit: { rtl: { target: "missing" } } }),
      );
      const { exitCode, out, err } = await runAll([], configuredDir);

      expect(exitCode).toBe(2);
      expect(err).toContain("[NOT_FOUND]");
      expect(out).toContain("2 of 10 audits failed: rtl (error), links (findings)");
    } finally {
      rmSync(configuredDir, { recursive: true, force: true });
    }
  });
});
