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
    for (const command of ["arrange", "audit", "mirror", "pack-slim", "tag"]) {
      expect(run.stdout).toContain(command);
    }
  });

  it("exits non-zero on an unknown command", () => {
    const run = runBin(["definitely-not-a-command"]);
    expect(run.status).not.toBe(0);
  });
});

describe("workspace discovery over the real monorepo", () => {
  it("mirror --dry-run reports the workspace packages without writing", () => {
    const run = runBin(["mirror", "--dry-run", "--json"], repoRoot);
    expect(run.status).toBe(0);
    const summary = JSON.parse(run.stdout) as {
      ok: boolean;
      write: boolean;
      stats: { packagesFound: number; packagesErrored: number };
    };
    expect(summary.ok).toBe(true);
    expect(summary.write).toBe(false);
    expect(summary.stats.packagesErrored).toBe(0);
    expect(summary.stats.packagesFound).toBeGreaterThan(0);
  });

  it("audit runs read-only over a source tree and exits clean", () => {
    const run = runBin(["audit", "imports", path.join(packageRoot, "src")]);
    expect(run.status).toBe(0);
  });
});

describe("single-package mode", () => {
  it("resolves a lone package.json (no ancestor pnpm-workspace.yaml) as the whole workspace", () => {
    const soloDir = mkdtempSync(path.join(tmpdir(), "codefast-cli-e2e-"));
    try {
      writeFileSync(path.join(soloDir, "package.json"), JSON.stringify({ name: "solo", version: "0.0.0" }));
      const run = runBin(["mirror", "--dry-run", "--json"], soloDir);
      expect(run.status).toBe(0);
      const summary = JSON.parse(run.stdout) as { ok: boolean; stats: { packagesFound: number } };
      expect(summary.ok).toBe(true);
      expect(summary.stats.packagesFound).toBe(1);
    } finally {
      rmSync(soloDir, { recursive: true, force: true });
    }
  });
});
