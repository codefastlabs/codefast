import path from "node:path";

import { describe, expect, it } from "vitest";

import type { CliFileEncoding, Filesystem } from "#/core/filesystem/filesystem";
import { listWorkspacePackageDirectories, resolveProjectRoot } from "#/core/workspace/resolver";

function createExistsOnlyFilesystem(existingPaths: Iterable<string>): Filesystem {
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
    globSync: () => unsupported("globSync"),
    readFile: (_filePath: string, _encoding: CliFileEncoding) => Promise.reject(new Error("unsupported: readFile")),
    writeFile: () => Promise.reject(new Error("unsupported: writeFile")),
    readdir: () => Promise.reject(new Error("unsupported: readdir")),
    rename: () => Promise.reject(new Error("unsupported: rename")),
    unlink: () => Promise.reject(new Error("unsupported: unlink")),
  };
}

function createWorkspaceFilesystem(options: {
  files: Record<string, string>;
  glob?: (pattern: string, cwd: string) => Array<string>;
}): Filesystem {
  const files = new Map(Object.entries(options.files));
  const unsupported = (operation: string): never => {
    throw new Error(`unsupported filesystem operation in test: ${operation}`);
  };
  return {
    existsSync: (filePath: string): boolean => files.has(filePath),
    canonicalPathSync: (inputPath: string): string => inputPath,
    statSync: () => unsupported("statSync"),
    readFileSync: () => unsupported("readFileSync"),
    writeFileSync: () => unsupported("writeFileSync"),
    readdirSync: () => unsupported("readdirSync"),
    globSync: (pattern, globOptions) =>
      options.glob ? options.glob(pattern, globOptions.cwd) : unsupported("globSync"),
    readFile: (filePath: string, encoding: CliFileEncoding) => {
      const content = files.get(filePath);
      if (content === undefined || encoding !== "utf8") {
        return Promise.reject(new Error(`unsupported read: ${filePath}`));
      }
      return Promise.resolve(content);
    },
    writeFile: () => Promise.reject(new Error("unsupported: writeFile")),
    readdir: () => Promise.reject(new Error("unsupported: readdir")),
    rename: () => Promise.reject(new Error("unsupported: rename")),
    unlink: () => Promise.reject(new Error("unsupported: unlink")),
  };
}

const workspaceYamlPath = "/repo/pnpm-workspace.yaml";

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

describe("listWorkspacePackageDirectories with a workspace file", () => {
  it("discovers, deduplicates, and sorts the declared package directories", async () => {
    const fs = createWorkspaceFilesystem({
      files: { [workspaceYamlPath]: 'packages:\n  - "packages/*"\n' },
      glob: (pattern) => {
        expect(pattern).toBe("packages/*/package.json");
        return ["packages/ui/package.json", "packages/di/package.json"];
      },
    });

    await expect(listWorkspacePackageDirectories("/repo", fs)).resolves.toEqual({
      packageDirectoryPathsAbsolute: [path.resolve("/repo", "packages/di"), path.resolve("/repo", "packages/ui")],
      layoutSource: "pnpm-workspace-yaml",
      hasPnpmWorkspaceYamlFile: true,
    });
  });

  it("drops directories matched by a negated exclude pattern", async () => {
    const fs = createWorkspaceFilesystem({
      files: { [workspaceYamlPath]: 'packages:\n  - "packages/*"\n  - "!packages/internal"\n' },
      glob: () => ["packages/ui/package.json", "packages/internal/package.json"],
    });

    await expect(listWorkspacePackageDirectories("/repo", fs)).resolves.toEqual({
      packageDirectoryPathsAbsolute: [path.resolve("/repo", "packages/ui")],
      layoutSource: "pnpm-workspace-yaml",
      hasPnpmWorkspaceYamlFile: true,
    });
  });

  it("falls back to default patterns when the document declares no packages key", async () => {
    const fs = createWorkspaceFilesystem({
      files: { [workspaceYamlPath]: "onlyBuiltDependencies:\n  - esbuild\n" },
      glob: (pattern) => {
        expect(pattern).toBe("packages/*/package.json");
        return ["packages/theme/package.json"];
      },
    });

    await expect(listWorkspacePackageDirectories("/repo", fs)).resolves.toEqual({
      packageDirectoryPathsAbsolute: [path.resolve("/repo", "packages/theme")],
      layoutSource: "default-patterns",
      hasPnpmWorkspaceYamlFile: true,
    });
  });

  it("treats an empty packages array as an explicitly empty workspace without globbing", async () => {
    const fs = createWorkspaceFilesystem({ files: { [workspaceYamlPath]: "packages: []\n" } });

    await expect(listWorkspacePackageDirectories("/repo", fs)).resolves.toEqual({
      packageDirectoryPathsAbsolute: [],
      layoutSource: "declared-empty",
      hasPnpmWorkspaceYamlFile: true,
    });
  });

  it("skips a glob that fails with a permission error instead of aborting", async () => {
    const fs = createWorkspaceFilesystem({
      files: { [workspaceYamlPath]: 'packages:\n  - "packages/*"\n' },
      glob: () => {
        const error: NodeJS.ErrnoException = new Error("permission denied");
        error.code = "EACCES";
        throw error;
      },
    });

    await expect(listWorkspacePackageDirectories("/repo", fs, true)).resolves.toEqual({
      packageDirectoryPathsAbsolute: [],
      layoutSource: "pnpm-workspace-yaml",
      hasPnpmWorkspaceYamlFile: true,
    });
  });

  it("rethrows a non-permission glob failure as an invalid-glob error", async () => {
    const fs = createWorkspaceFilesystem({
      files: { [workspaceYamlPath]: 'packages:\n  - "packages/*"\n' },
      glob: () => {
        throw new Error("bad pattern");
      },
    });

    await expect(listWorkspacePackageDirectories("/repo", fs)).rejects.toThrow(/Invalid workspace glob/);
  });
});
