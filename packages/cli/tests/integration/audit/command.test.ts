import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runCli } from "#cli";
import { refuseColor } from "#core/style";
import { captureLogger } from "#tests/unit/support/logger-capture";

let projectDir: string;
let previousExitCode: typeof process.exitCode;

beforeEach(() => {
  projectDir = realpathSync(mkdtempSync(path.join(tmpdir(), "codefast-audit-cmd-")));
  writeFileSync(path.join(projectDir, "package.json"), JSON.stringify({ name: "solo", private: true }));
  writeFileSync(path.join(projectDir, "guide.md"), ["# Title", "", "[back to top](#title)"].join("\n"));
  previousExitCode = process.exitCode;
  refuseColor(true);
  vi.spyOn(process, "cwd").mockReturnValue(projectDir);
});

afterEach(() => {
  process.exitCode = previousExitCode;
  refuseColor(false);
  vi.restoreAllMocks();
  rmSync(projectDir, { recursive: true, force: true });
});

// Drives the real CLI in-process, through the one pipeline every command shares.
async function run(args: Array<string>): Promise<{ exitCode: number; out: string; err: string }> {
  process.exitCode = undefined;
  const printed = captureLogger();
  const exitCode = await runCli(["node", "codefast", ...args]);
  return { exitCode, out: printed.out(), err: printed.err() };
}

describe("an audit:<name> command", () => {
  it("prints the shared JSON document with exit 0 for a clean scan", async () => {
    const { exitCode, out } = await run(["audit:links", "guide.md", "--json"]);

    expect(exitCode).toBe(0);
    expect(JSON.parse(out)).toMatchObject({ schemaVersion: 3, command: "audit:links", ok: true, target: "guide.md" });
  });

  it("prints the human report without --json", async () => {
    const { exitCode, out } = await run(["audit:links"]);

    expect(exitCode).toBe(0);
    expect(out).toContain("✓ audit:links: no findings in 1 file");
  });

  it("reports no floors for a target holding no package", async () => {
    const { exitCode, out } = await run(["audit:engines", "--json"]);

    expect(exitCode).toBe(0);
    expect(JSON.parse(out)).toMatchObject({ ok: true, result: { floors: [], findings: [], scannedPackages: 1 } });
  });
});

describe("a full audit run", () => {
  it("reports every audit that ran as clean, and skips one the config turns off", async () => {
    writeFileSync(path.join(projectDir, "codefast.config.json"), JSON.stringify({ audit: { rtl: false } }));

    const { exitCode, out } = await run(["audit"]);

    expect(exitCode).toBe(0);
    expect(out).toContain("✓ audit:links: no findings in 1 file");
    expect(out).toContain("○ audit:rtl: turned off in the config");
    expect(out).toContain("✓ audit: all 9 audits that ran are clean");
  });

  it("drops a finding the config allowlists, and counts it", async () => {
    writeFileSync(path.join(projectDir, "README.md"), "# Solo\n\n[gone](./missing.md)\n");
    writeFileSync(
      path.join(projectDir, "codefast.config.json"),
      JSON.stringify({ audit: { links: { allowlist: ["README.md:./missing.md"] } } }),
    );

    const { exitCode, out } = await run(["audit:links", "--json"]);

    expect(exitCode).toBe(0);
    expect(JSON.parse(out)).toMatchObject({ ok: true, result: { findings: [], allowlisted: 1 } });
  });

  it("exits 1 and names the audit with findings", async () => {
    writeFileSync(path.join(projectDir, "README.md"), "# Solo\n\n[gone](./missing.md)\n");

    const { exitCode, out } = await run(["audit", "--json"]);
    const summary = JSON.parse(out) as { ok: boolean; result: { audits: Array<{ name: string; status: string }> } };

    expect(exitCode).toBe(1);
    expect(summary.ok).toBe(false);
    expect(summary.result.audits.find((audit) => audit.name === "links")?.status).toBe("findings");
    expect(summary.result.audits.find((audit) => audit.name === "rtl")?.status).toBe("clean");
  });

  it("exits 2 when an audit cannot run, and still runs the rest", async () => {
    writeFileSync(path.join(projectDir, "README.md"), "# Solo\n\n[gone](./missing.md)\n");
    writeFileSync(
      path.join(projectDir, "codefast.config.json"),
      JSON.stringify({ audit: { rtl: { target: "missing" } } }),
    );

    const { exitCode, out } = await run(["audit"]);

    expect(exitCode).toBe(2);
    expect(out).toContain("✗ audit:rtl: [NOT_FOUND]");
    expect(out).toContain("✗ audit: 2 of 10 failed — rtl (error), links (findings)");
  });
});
