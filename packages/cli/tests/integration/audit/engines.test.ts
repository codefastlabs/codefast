import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { EnginesAuditResult } from "#audit/domain/types";
import { runEnginesAudit } from "#audit/engines/run";
import { nodeFilesystem } from "#core/filesystem/node";

let rootDir: string;

beforeEach(() => {
  rootDir = mkdtempSync(path.join(tmpdir(), "codefast-audit-engines-"));
  write("pnpm-workspace.yaml", "packages:\n  - packages/*\n");
  writeJson("package.json", { name: "root", private: true, engines: { node: ">=24.0.0" } });
});

afterEach(() => {
  rmSync(rootDir, { recursive: true, force: true });
});

function write(relativePath: string, content: string): void {
  const filePath = path.join(rootDir, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function writeJson(relativePath: string, value: unknown): void {
  write(relativePath, JSON.stringify(value));
}

function writePackage(directory: string, manifest: Record<string, unknown>): void {
  writeJson(`packages/${directory}/package.json`, manifest);
}

// A lockfile whose importers resolve `@types/node` to the given version per package directory.
function writeLockfile(typesVersions: Record<string, string>): void {
  const importers = Object.entries(typesVersions)
    .map(
      ([directory, version]) =>
        `  packages/${directory}:\n    devDependencies:\n      '@types/node':\n        specifier: catalog:node24\n        version: ${version}\n`,
    )
    .join("\n");
  write("pnpm-lock.yaml", `lockfileVersion: '9.0'\n\nimporters:\n\n${importers}`);
}

async function audit(targetPath = rootDir): Promise<EnginesAuditResult> {
  const outcome = await runEnginesAudit(nodeFilesystem, { rootDir, targetPath });
  if (!outcome.ok) {
    throw outcome.error;
  }
  return outcome.value;
}

describe("audit engines", () => {
  it("lists every floor and passes when each holds", async () => {
    writePackage("core", { name: "@x/core", engines: { node: ">=24.0.0" } });
    writePackage("app", {
      name: "@x/app",
      engines: { node: ">=26.0.0" },
      dependencies: { "@x/core": "workspace:*" },
    });
    writeLockfile({ core: "24.0.15", app: "26.0.1" });

    expect(await audit()).toEqual({
      toolchainFloor: "24.0.0",
      floors: [
        { packageName: "@x/app", directory: "packages/app", floor: "26.0.0" },
        { packageName: "@x/core", directory: "packages/core", floor: "24.0.0" },
      ],
      violations: [],
      packageCount: 2,
    });
  });

  it("flags a published package with no floor, but not a private one", async () => {
    writePackage("lib", { name: "@x/lib" });
    writePackage("site", { name: "@x/site", private: true });

    expect((await audit()).violations).toEqual([{ kind: "missing-floor", packageName: "@x/lib" }]);
  });

  it("flags a floor not written as >=X.Y.Z", async () => {
    writePackage("lib", { name: "@x/lib", engines: { node: "^24.0.0" } });

    expect((await audit()).violations).toEqual([{ kind: "unparsable-floor", packageName: "@x/lib", range: "^24.0.0" }]);
  });

  it("flags a floor below the toolchain's", async () => {
    writePackage("lib", { name: "@x/lib", engines: { node: ">=22.0.0" } });

    expect((await audit()).violations).toEqual([
      { kind: "below-toolchain", packageName: "@x/lib", floor: "22.0.0", toolchainFloor: "24.0.0" },
    ]);
  });

  it("flags a floor below a runtime dependency's, peers included", async () => {
    writePackage("core", { name: "@x/core", engines: { node: ">=26.0.0" } });
    writePackage("testing", {
      name: "@x/testing",
      engines: { node: ">=24.0.0" },
      peerDependencies: { "@x/core": ">=0.1.0" },
    });

    expect((await audit()).violations).toEqual([
      {
        kind: "below-dependency",
        packageName: "@x/testing",
        floor: "24.0.0",
        dependency: "@x/core",
        dependencyFloor: "26.0.0",
      },
    ]);
  });

  it("leaves a dev dependency's floor alone, since it runs on the toolchain", async () => {
    writePackage("tool", { name: "@x/tool", engines: { node: ">=26.0.0" } });
    writePackage("lib", {
      name: "@x/lib",
      engines: { node: ">=24.0.0" },
      devDependencies: { "@x/tool": "workspace:*" },
    });

    expect((await audit()).violations).toEqual([]);
  });

  it("flags @types/node resolved off the floor's release line", async () => {
    writePackage("lib", { name: "@x/lib", engines: { node: ">=24.0.0" } });
    writeLockfile({ lib: "24.4.0" });

    expect((await audit()).violations).toEqual([
      { kind: "types-off-floor", packageName: "@x/lib", floor: "24.0.0", typesVersion: "24.4.0" },
    ]);
  });

  it("checks only the packages a narrower target reaches", async () => {
    writePackage("core", { name: "@x/core", engines: { node: ">=26.0.0" } });
    writePackage("lib", { name: "@x/lib", dependencies: { "@x/core": "workspace:*" } });
    writePackage("app", { name: "@x/app", engines: { node: ">=24.0.0" }, dependencies: { "@x/core": "workspace:*" } });

    const result = await audit(path.join(rootDir, "packages/app/src"));

    expect(result.packageCount).toBe(1);
    expect(result.violations).toEqual([
      {
        kind: "below-dependency",
        packageName: "@x/app",
        floor: "24.0.0",
        dependency: "@x/core",
        dependencyFloor: "26.0.0",
      },
    ]);
  });
});
