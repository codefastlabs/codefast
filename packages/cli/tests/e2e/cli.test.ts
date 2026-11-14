import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const repoRoot = path.resolve(packageRoot, "..", "..");
const binPath = path.join(packageRoot, "dist", "bin.js");
const packageVersion = (
  JSON.parse(
    execFileSync("node", ["-p", "JSON.stringify(require('./package.json'))"], { cwd: packageRoot, encoding: "utf8" }),
  ) as { version: string }
).version;

interface CliRun {
  status: number;
  stdout: string;
  stderr: string;
}

function runBin(args: Array<string>, cwd: string = packageRoot): CliRun {
  const result = spawnSync("node", [binPath, ...args], { cwd, encoding: "utf8" });
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr };
}

// The e2e tier drives the built binary; build it once if a prior turbo/build step has not.
beforeAll(() => {
  if (!existsSync(binPath)) {
    execFileSync("pnpm", ["build"], { cwd: packageRoot, stdio: "ignore" });
  }
}, 180_000);

describe("codefast binary", () => {
  it("prints its package version for --version", () => {
    const run = runBin(["--version"]);
    expect(run.status).toBe(0);
    expect(run.stdout.trim()).toBe(packageVersion);
  });

  it("lists its commands for --help", () => {
    const run = runBin(["--help"]);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("Codefast monorepo developer CLI");
    for (const command of ["audit", "audit:links", "exports:generate", "publish:prepare", "since:stamp"]) {
      expect(run.stdout).toContain(command);
    }
  });

  it("exits 2 on an unknown command", () => {
    const run = runBin(["definitely-not-a-command"]);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("unknown command");
  });

  it("lists its commands and exits 0 when run with no command", () => {
    const run = runBin([]);
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("exports:generate");
  });

  it("exits 2 on an unknown option", () => {
    expect(runBin(["audit:links", "--definitely-not-an-option"]).status).toBe(2);
  });

  it("exits 2 when an audit target does not exist, apart from the 1 its findings record", () => {
    const run = runBin(["audit:links", path.join(packageRoot, "definitely-missing")]);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain("[NOT_FOUND]");
  });
});

describe("a full audit run", () => {
  it("runs every audit, reports each one failing, and exits 1 for findings", () => {
    const soloDir = mkdtempSync(path.join(tmpdir(), "codefast-cli-e2e-"));
    try {
      writeFileSync(path.join(soloDir, "package.json"), JSON.stringify({ name: "solo", private: true }));
      writeFileSync(path.join(soloDir, "README.md"), "# Solo\n\n[gone](./missing.md)\n");
      const run = runBin(["audit", "--json"], soloDir);
      const summary = JSON.parse(run.stdout) as {
        ok: boolean;
        result: { audits: Array<{ name: string; status: string }> };
      };
      expect(run.status).toBe(1);
      expect(summary.ok).toBe(false);
      expect(summary.result.audits).toHaveLength(10);
      expect(summary.result.audits.find((audit) => audit.name === "links")?.status).toBe("findings");
      expect(summary.result.audits.find((audit) => audit.name === "rtl")?.status).toBe("skipped");
    } finally {
      rmSync(soloDir, { recursive: true, force: true });
    }
  });

  it("delivers a --json document larger than one pipe buffer whole", () => {
    const soloDir = mkdtempSync(path.join(tmpdir(), "codefast-cli-e2e-"));
    try {
      writeFileSync(path.join(soloDir, "package.json"), JSON.stringify({ name: "solo", private: true }));
      const links = Array.from({ length: 3000 }, (_, index) => `[gone](./missing-${index}.md)`);
      writeFileSync(path.join(soloDir, "README.md"), `# Solo\n\n${links.join("\n")}\n`);
      const run = runBin(["audit:links", soloDir, "--json"], soloDir);
      expect(run.stdout.length).toBeGreaterThan(65_536);
      expect(() => JSON.parse(run.stdout) as unknown).not.toThrow();
    } finally {
      rmSync(soloDir, { recursive: true, force: true });
    }
  });
});

describe("workspace discovery over the real monorepo", () => {
  it("exports:generate --dry-run reports the workspace packages without writing", () => {
    const run = runBin(["exports:generate", "--dry-run", "--json"], repoRoot);
    expect(run.status).toBe(0);
    const summary = JSON.parse(run.stdout) as {
      ok: boolean;
      command: string;
      result: { packages: Array<{ status: string }> };
    };
    expect(summary).toMatchObject({ ok: true, command: "exports:generate" });
    expect(summary.result.packages.length).toBeGreaterThan(0);
    expect(summary.result.packages.every(({ status }) => status !== "failed" && status !== "changed")).toBe(true);
  });

  it("audit runs read-only over a source tree and exits clean", () => {
    const run = runBin(["audit:imports", path.join(packageRoot, "src")]);
    expect(run.status).toBe(0);
  });
});

describe("single-package mode", () => {
  it("resolves a lone package.json (no ancestor pnpm-workspace.yaml) as the whole workspace", () => {
    const soloDir = mkdtempSync(path.join(tmpdir(), "codefast-cli-e2e-"));
    try {
      writeFileSync(path.join(soloDir, "package.json"), JSON.stringify({ name: "solo", version: "0.0.0" }));
      const run = runBin(["exports:generate", "--dry-run", "--json"], soloDir);
      expect(run.status).toBe(0);
      const summary = JSON.parse(run.stdout) as { ok: boolean; result: { packages: Array<{ directory: string }> } };
      expect(summary.ok).toBe(true);
      expect(summary.result.packages).toEqual([expect.objectContaining({ directory: "." })]);
    } finally {
      rmSync(soloDir, { recursive: true, force: true });
    }
  });
});
