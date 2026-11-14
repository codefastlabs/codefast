import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { logger } from "#core/logger";
import { listPackageDirectories, resolveProjectRoot } from "#core/workspace/resolver";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");

function workspace(yaml: string, packages: Array<string>): ReturnType<typeof createMemoryFilesystem> {
  return createMemoryFilesystem({
    [path.join(root, "pnpm-workspace.yaml")]: yaml,
    ...Object.fromEntries(packages.map((directory) => [path.join(root, directory, "package.json"), "{}"])),
  });
}

describe("resolveProjectRoot", () => {
  it("resolves the pnpm-workspace.yaml directory as a workspace root", () => {
    const { fs } = workspace("packages: []\n", []);

    expect(resolveProjectRoot(path.join(root, "packages/ui"), fs)).toEqual({ rootDir: root, mode: "workspace" });
  });

  it("falls back to the nearest package.json as a single-package root", () => {
    const { fs } = createMemoryFilesystem({ [path.join(root, "package.json")]: "{}" });

    expect(resolveProjectRoot(path.join(root, "src/components"), fs)).toEqual({
      rootDir: root,
      mode: "single-package",
    });
  });

  it("throws when neither a workspace file nor a package.json is found", () => {
    expect(() => resolveProjectRoot(root, createMemoryFilesystem({}).fs)).toThrow(/Could not locate a project root/);
  });
});

describe("listPackageDirectories", () => {
  it("returns the root alone for a single-package project", () => {
    const { fs } = createMemoryFilesystem({});

    expect(listPackageDirectories({ rootDir: root, mode: "single-package" }, fs)).toEqual([root]);
  });

  it("discovers and sorts the declared package directories, dropping a negated pattern", () => {
    const { fs } = workspace('packages:\n  - "packages/*"\n  - "!packages/internal"\n', [
      "packages/ui",
      "packages/di",
      "packages/internal",
    ]);

    expect(listPackageDirectories({ rootDir: root, mode: "workspace" }, fs)).toEqual([
      path.join(root, "packages/di"),
      path.join(root, "packages/ui"),
    ]);
  });

  it("falls back to packages/* when the document declares no packages key, and lists none for an empty array", () => {
    const fallback = workspace("onlyBuiltDependencies:\n  - esbuild\n", ["packages/theme", "apps/web"]);
    const empty = workspace("packages: []\n", ["packages/theme"]);

    expect(listPackageDirectories({ rootDir: root, mode: "workspace" }, fallback.fs)).toEqual([
      path.join(root, "packages/theme"),
    ]);
    expect(listPackageDirectories({ rootDir: root, mode: "workspace" }, empty.fs)).toEqual([]);
  });

  it("skips a glob it may not read with a warning on stderr, and rethrows any other glob failure", () => {
    const { fs } = workspace('packages:\n  - "packages/*"\n', []);
    const err = vi.spyOn(logger, "err").mockImplementation(() => {});
    const denied: NodeJS.ErrnoException = new Error("permission denied");
    denied.code = "EACCES";

    const skipped = listPackageDirectories(
      { rootDir: root, mode: "workspace" },
      {
        ...fs,
        globSync: () => {
          throw denied;
        },
      },
    );

    expect(skipped).toEqual([]);
    expect(err).toHaveBeenCalledWith(expect.stringContaining('Skipping workspace glob "packages/*"'));
    expect(() =>
      listPackageDirectories(
        { rootDir: root, mode: "workspace" },
        {
          ...fs,
          globSync: () => {
            throw new Error("bad pattern");
          },
        },
      ),
    ).toThrow(/Invalid workspace glob/);
    err.mockRestore();
  });
});
