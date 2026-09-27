import path from "node:path";

import { describe, expect, it } from "vitest";

import { prepareLayersAudit } from "#audit/layers/prepare";
import type { DirectoryEntry, Filesystem } from "#core/filesystem/filesystem";
import { createWorkspaceFilesystem } from "#tests/unit/support/fake-workspace-filesystem";

/** A workspace of one package, with a JSON config the loader reads through the filesystem. */
function createLayeredWorkspace(rootDir: string, config: unknown): Filesystem {
  const packageDir = path.join(rootDir, "packages", "di");
  const manifestPath = path.join(packageDir, "package.json");
  const existing = new Set([
    rootDir,
    path.join(rootDir, "pnpm-workspace.yaml"),
    path.join(rootDir, "codefast.config.json"),
    manifestPath,
    path.join(packageDir, "src"),
  ]);
  return {
    existsSync: (filePath) => existing.has(filePath),
    canonicalPathSync: (inputPath) => inputPath,
    statSync: () => ({ isDirectory: () => true, isFile: () => false }),
    readFileSync: (filePath) => (filePath === manifestPath ? JSON.stringify({ name: "@acme/di" }) : ""),
    writeFileSync: () => {},
    readdirSync: () => [],
    readFile: async (filePath) => {
      if (filePath.endsWith("pnpm-workspace.yaml")) {
        return "packages:\n  - packages/*\n";
      }
      return JSON.stringify(config);
    },
    writeFile: async () => {},
    readdirEntries: async (): Promise<Array<DirectoryEntry>> => [],
    globSync: () => ["packages/di/package.json"],
    rename: async () => {},
    unlink: async () => {},
  };
}

describe("prepareLayersAudit", () => {
  it("resolves to no packages when the config names none", async () => {
    const rootDir = path.join(path.sep, "layers-none");
    const outcome = await prepareLayersAudit(createWorkspaceFilesystem({ rootDir }), {
      currentWorkingDirectory: rootDir,
      rawTarget: undefined,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value).toEqual({ rootDir, targetPath: rootDir, allowlist: [], packages: [] });
  });

  it("resolves a configured package to the root its layers sit under", async () => {
    const rootDir = path.join(path.sep, "layers-ok");
    const fs = createLayeredWorkspace(rootDir, {
      audit: { layers: { packages: { "@acme/di": { layers: [["core"], ["index.ts"]] } }, allowlist: ["x"] } },
    });
    const outcome = await prepareLayersAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: undefined });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.allowlist).toEqual(["x"]);
    expect(outcome.value.packages).toEqual([
      { name: "@acme/di", rootPath: path.join(rootDir, "packages", "di", "src"), layers: [["core"], ["index.ts"]] },
    ]);
  });

  it("refuses a package name the workspace does not hold", async () => {
    const rootDir = path.join(path.sep, "layers-unknown");
    const fs = createLayeredWorkspace(rootDir, {
      audit: { layers: { packages: { "@acme/nope": { layers: [["core"]] } } } },
    });
    const outcome = await prepareLayersAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: undefined });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("VALIDATION_ERROR");
    expect(outcome.error.message).toContain("@acme/nope");
  });

  it("refuses a layer entry nested below the root", async () => {
    const rootDir = path.join(path.sep, "layers-nested");
    const fs = createLayeredWorkspace(rootDir, {
      audit: { layers: { packages: { "@acme/di": { layers: [["core"], ["engine/plan"]] } } } },
    });
    const outcome = await prepareLayersAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: undefined });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("VALIDATION_ERROR");
    expect(outcome.error.message).toContain('"engine/plan"');
  });

  it("refuses a root that does not exist", async () => {
    const rootDir = path.join(path.sep, "layers-root");
    const fs = createLayeredWorkspace(rootDir, {
      audit: { layers: { packages: { "@acme/di": { root: "lib", layers: [["core"]] } } } },
    });
    const outcome = await prepareLayersAudit(fs, { currentWorkingDirectory: rootDir, rawTarget: undefined });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      return;
    }
    expect(outcome.error.code).toBe("NOT_FOUND");
  });
});
