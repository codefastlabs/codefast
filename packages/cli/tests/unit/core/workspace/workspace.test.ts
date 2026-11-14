import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadWorkspace, owningPackage, packagesInTarget } from "#core/workspace/workspace";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");

function workspaceFiles(): Record<string, string> {
  return {
    [path.join(root, "pnpm-workspace.yaml")]: 'packages:\n  - "packages/*"\n',
    [path.join(root, "package.json")]: JSON.stringify({ name: "repo", private: true }),
    [path.join(root, "packages/ui/package.json")]: JSON.stringify({ name: "@acme/ui", version: "1.0.0" }),
    [path.join(root, "packages/ui/src/button.ts")]: "export const button = 1;\n",
    [path.join(root, "packages/kit/package.json")]: JSON.stringify({ private: true }),
  };
}

describe("loadWorkspace", () => {
  it("reads the root, its config and every package manifest once", async () => {
    const { fs } = createMemoryFilesystem({
      ...workspaceFiles(),
      [path.join(root, "codefast.config.json")]: JSON.stringify({ since: { "@apps/*": false } }),
    });

    const workspace = await loadWorkspace(fs, path.join(root, "packages/ui/src"));

    expect(workspace.ok && workspace.value).toMatchObject({
      rootDir: root,
      mode: "workspace",
      config: { since: { "@apps/*": false } },
      rootManifest: { name: "repo" },
      packages: [
        { name: "packages/kit", relativeDirectory: "packages/kit", isPrivate: true },
        { name: "@acme/ui", relativeDirectory: "packages/ui", isPrivate: false, manifest: { version: "1.0.0" } },
      ],
    });
  });

  it("treats a lone package.json as a single-package project", async () => {
    const { fs } = createMemoryFilesystem({ [path.join(root, "package.json")]: '{"name":"solo"}' });

    const workspace = await loadWorkspace(fs, root);

    expect(workspace.ok && workspace.value).toMatchObject({
      mode: "single-package",
      packages: [{ name: "solo", relativeDirectory: "." }],
    });
  });

  it("fails as NOT_FOUND where no project root exists", async () => {
    const workspace = await loadWorkspace(createMemoryFilesystem({}).fs, root);

    expect(!workspace.ok && workspace.error.code).toBe("NOT_FOUND");
  });

  it("names the manifest that is not a JSON object", async () => {
    const { fs } = createMemoryFilesystem({
      ...workspaceFiles(),
      [path.join(root, "packages/kit/package.json")]: "[]",
    });

    const workspace = await loadWorkspace(fs, root);

    expect(!workspace.ok && workspace.error.message).toContain(path.join("packages", "kit", "package.json"));
  });
});

describe("packagesInTarget and owningPackage", () => {
  it("reaches every package beneath a directory, or else the package holding the target", async () => {
    const { fs } = createMemoryFilesystem(workspaceFiles());
    const workspace = await loadWorkspace(fs, root);
    if (!workspace.ok) {
      throw new Error(workspace.error.message);
    }

    expect(packagesInTarget(workspace.value, root).map(({ name }) => name)).toEqual(["packages/kit", "@acme/ui"]);
    expect(
      packagesInTarget(workspace.value, path.join(root, "packages/ui/src/button.ts")).map(({ name }) => name),
    ).toEqual(["@acme/ui"]);
    expect(owningPackage(workspace.value, path.join(root, "README.md"))).toBeUndefined();
  });
});
