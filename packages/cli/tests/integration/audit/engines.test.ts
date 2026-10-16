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

// The env document pnpm writes ahead of the dependency lockfile to pin pnpm itself.
const envDocument =
  "---\nlockfileVersion: '9.0'\n\nimporters:\n\n  .:\n    packageManagerDependencies:\n      pnpm:\n        specifier: 12.14.0\n        version: 12.14.0\n\n---\n";

// A lockfile whose importers resolve `@types/node` to the given version per package directory.
function writeLockfile(typesVersions: Record<string, string>, prefix = ""): void {
  const importers = Object.entries(typesVersions)
    .map(
      ([directory, version]) =>
        `  packages/${directory}:\n    devDependencies:\n      '@types/node':\n        specifier: catalog:node24\n        version: ${version}\n`,
    )
    .join("\n");
  write("pnpm-lock.yaml", `${prefix}lockfileVersion: '9.0'\n\nimporters:\n\n${importers}`);
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
    writePackage("core", { name: "@x/core", engines: { node: ">=22.12.0" } });
    writePackage("app", {
      name: "@x/app",
      engines: { node: ">=24.0.0" },
      dependencies: { "@x/core": "workspace:*" },
    });
    writeLockfile({ core: "22.12.0", app: "24.0.15" });

    expect(await audit()).toEqual({
      floors: [
        { packageName: "@x/app", directory: "packages/app", floor: "24.0.0" },
        { packageName: "@x/core", directory: "packages/core", floor: "22.12.0" },
      ],
      violations: [],
      packageCount: 2,
    });
  });

  it("lets a package sit below the workspace root's own floor", async () => {
    writePackage("lib", { name: "@x/lib", engines: { node: ">=22.12.0" } });

    expect((await audit()).violations).toEqual([]);
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

  it("flags a floor below a workspace dependency's, peers included", async () => {
    writePackage("core", { name: "@x/core", engines: { node: ">=24.0.0" } });
    writePackage("testing", {
      name: "@x/testing",
      engines: { node: ">=22.12.0" },
      peerDependencies: { "@x/core": ">=0.1.0" },
    });

    expect((await audit()).violations).toEqual([
      {
        kind: "outside-dependency-engines",
        packageName: "@x/testing",
        floor: "22.12.0",
        dependency: "@x/core",
        field: "peerDependencies",
        range: ">=24.0.0",
      },
    ]);
  });

  it("holds the floor to an installed dev dependency's engines, since CI runs its tests there", async () => {
    writePackage("lib", { name: "@x/lib", engines: { node: ">=22.0.0" }, devDependencies: { vitest: "^5.0.0" } });
    writeJson("packages/lib/node_modules/vitest/package.json", {
      name: "vitest",
      engines: { node: "^22.12.0 || ^24.0.0 || >=26.0.0" },
    });

    expect((await audit()).violations).toEqual([
      {
        kind: "outside-dependency-engines",
        packageName: "@x/lib",
        floor: "22.0.0",
        dependency: "vitest",
        field: "devDependencies",
        range: "^22.12.0 || ^24.0.0 || >=26.0.0",
      },
    ]);
  });

  it("passes a floor every dependency's engines admit, and skips a range no parser reads", async () => {
    writePackage("lib", {
      name: "@x/lib",
      engines: { node: ">=22.12.0" },
      dependencies: { "@scope/old": "^1.0.0", missing: "^1.0.0" },
      devDependencies: { vitest: "^5.0.0" },
    });
    writeJson("packages/lib/node_modules/vitest/package.json", { engines: { node: "^22.12.0 || >=24.0.0" } });
    writeJson("packages/lib/node_modules/@scope/old/package.json", { engines: { node: "node >= 0.8" } });

    expect((await audit()).violations).toEqual([]);
  });

  it("flags @types/node resolved newer than the floor, and passes an older minor", async () => {
    writePackage("lib", { name: "@x/lib", engines: { node: ">=22.12.0" } });
    writePackage("harness", { name: "@x/harness", engines: { node: ">=22.18.0" } });
    writeLockfile({ lib: "22.13.0", harness: "22.12.0" });

    expect((await audit()).violations).toEqual([
      { kind: "types-off-floor", packageName: "@x/lib", floor: "22.12.0", typesVersion: "22.13.0" },
    ]);
  });

  it("reads @types/node from the dependency lockfile behind pnpm's env document", async () => {
    writePackage("lib", { name: "@x/lib", engines: { node: ">=22.12.0" } });
    writeLockfile({ lib: "22.13.0" }, envDocument);

    expect((await audit()).violations).toEqual([
      { kind: "types-off-floor", packageName: "@x/lib", floor: "22.12.0", typesVersion: "22.13.0" },
    ]);
  });

  it("checks only the packages a narrower target reaches", async () => {
    writePackage("core", { name: "@x/core", engines: { node: ">=24.0.0" } });
    writePackage("lib", { name: "@x/lib", dependencies: { "@x/core": "workspace:*" } });
    writePackage("app", {
      name: "@x/app",
      engines: { node: ">=22.12.0" },
      dependencies: { "@x/core": "workspace:*" },
    });

    const result = await audit(path.join(rootDir, "packages/app/src"));

    expect(result.packageCount).toBe(1);
    expect(result.violations).toEqual([
      {
        kind: "outside-dependency-engines",
        packageName: "@x/app",
        floor: "22.12.0",
        dependency: "@x/core",
        field: "dependencies",
        range: ">=24.0.0",
      },
    ]);
  });

  it("reports an unreadable manifest as an infrastructure failure", async () => {
    write("packages/lib/package.json", "{ not json");

    const outcome = await runEnginesAudit(nodeFilesystem, { rootDir, targetPath: rootDir });

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
  });
});
