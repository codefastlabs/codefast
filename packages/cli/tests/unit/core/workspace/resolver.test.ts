import { describe, expect, it } from "vitest";

import type { CliFileEncoding, FilesystemPort } from "#/core/filesystem/port";
import { listWorkspacePackageDirectories, resolveProjectRoot } from "#/core/workspace/resolver";

function createExistsOnlyFilesystem(existingPaths: Iterable<string>): FilesystemPort {
  const present = new Set(existingPaths);
  const unsupported = (operation: string): never => {
    throw new Error(`unsupported filesystem operation in test: ${operation}`);
  };
  return {
    existsSync: (filePath: string): boolean => present.has(filePath),
    canonicalPathSync: (inputPath: string): string => inputPath,
    statSync: () => unsupported("statSync"),
    readFileSync: () => unsupported("readFileSync"),
    writeFileSync: () => unsupported("writeFileSync"),
    readdirSync: () => unsupported("readdirSync"),
    readFile: (_filePath: string, _encoding: CliFileEncoding) => Promise.reject(new Error("unsupported: readFile")),
    writeFile: () => Promise.reject(new Error("unsupported: writeFile")),
    readdir: () => Promise.reject(new Error("unsupported: readdir")),
    rename: () => Promise.reject(new Error("unsupported: rename")),
    unlink: () => Promise.reject(new Error("unsupported: unlink")),
  };
}

describe("resolveProjectRoot", () => {
  it("resolves the pnpm-workspace.yaml directory as a workspace root", () => {
    const fs = createExistsOnlyFilesystem(["/repo/pnpm-workspace.yaml"]);

    expect(resolveProjectRoot("/repo/packages/ui", fs)).toEqual({ rootDir: "/repo", mode: "workspace" });
  });

  it("falls back to the nearest package.json as a single-package root", () => {
    const fs = createExistsOnlyFilesystem(["/proj/package.json"]);

    expect(resolveProjectRoot("/proj/src/components", fs)).toEqual({ rootDir: "/proj", mode: "single-package" });
  });

  it("throws when neither a workspace file nor a package.json is found", () => {
    const fs = createExistsOnlyFilesystem([]);

    expect(() => resolveProjectRoot("/nowhere", fs)).toThrow(/Could not locate a project root/);
  });
});

describe("listWorkspacePackageDirectories without a workspace file", () => {
  it("returns the root itself as the single package", async () => {
    const fs = createExistsOnlyFilesystem(["/proj/package.json"]);

    await expect(listWorkspacePackageDirectories("/proj", fs)).resolves.toEqual({
      packageDirectoryPathsAbsolute: ["/proj"],
      layoutSource: "single-package",
      hasPnpmWorkspaceYamlFile: false,
    });
  });

  it("returns no packages when the root has no package.json", async () => {
    const fs = createExistsOnlyFilesystem([]);

    await expect(listWorkspacePackageDirectories("/proj", fs)).resolves.toEqual({
      packageDirectoryPathsAbsolute: [],
      layoutSource: "single-package",
      hasPnpmWorkspaceYamlFile: false,
    });
  });
});
