import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveLayeredPackages } from "#audit/layers/layered-packages";
import { loadWorkspace } from "#core/workspace/workspace";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");

async function resolve(layers: object) {
  const { fs } = createMemoryFilesystem({
    [path.join(root, "pnpm-workspace.yaml")]: "packages:\n  - packages/*\n",
    [path.join(root, "packages/di/package.json")]: '{"name":"@acme/di"}',
    [path.join(root, "packages/di/src/index.ts")]: "",
    [path.join(root, "codefast.config.json")]: JSON.stringify({ audit: { layers } }),
  });
  const workspace = await loadWorkspace(fs, root);
  if (!workspace.ok) {
    throw new Error(workspace.error.message);
  }
  return resolveLayeredPackages(fs, workspace.value);
}

describe("resolveLayeredPackages", () => {
  it("resolves to no packages when the config names none", async () => {
    expect(await resolve({})).toEqual({ ok: true, value: [] });
  });

  it("resolves a configured package to the root its layers sit under", async () => {
    expect(await resolve({ packages: { "@acme/di": { layers: [["core"], ["index.ts"]] } } })).toEqual({
      ok: true,
      value: [{ name: "@acme/di", rootPath: path.join(root, "packages/di/src"), layers: [["core"], ["index.ts"]] }],
    });
  });

  it("refuses a package name the workspace does not hold, and a layer entry nested below the root", async () => {
    const unknown = await resolve({ packages: { "@acme/nope": { layers: [["core"]] } } });
    const nested = await resolve({ packages: { "@acme/di": { layers: [["core"], ["engine/plan"]] } } });

    expect(!unknown.ok && unknown.error).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(!unknown.ok && unknown.error.message).toContain("@acme/nope");
    expect(!nested.ok && nested.error.message).toContain('"engine/plan"');
  });

  it("refuses a root that does not exist", async () => {
    const outcome = await resolve({ packages: { "@acme/di": { root: "lib", layers: [["core"]] } } });

    expect(!outcome.ok && outcome.error.code).toBe("NOT_FOUND");
  });
});
