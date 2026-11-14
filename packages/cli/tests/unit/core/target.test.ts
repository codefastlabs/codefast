import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveTarget } from "#core/target";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");
const { fs } = createMemoryFilesystem({
  [path.join(root, "package.json")]: "{}",
  [path.join(root, "packages/ui/src/button.ts")]: "",
});

describe("resolveTarget", () => {
  it("resolves a given path against the working directory", () => {
    const target = resolveTarget(fs, {
      rootDir: root,
      currentWorkingDirectory: path.join(root, "packages/ui"),
      given: "src/button.ts",
      configured: "ignored",
    });

    expect(target.ok && target.value).toEqual({
      path: path.join(root, "packages/ui/src/button.ts"),
      relativePath: "packages/ui/src/button.ts",
      isFile: true,
    });
  });

  it("falls back to the configured target against the root, then to the root itself", () => {
    const cwd = path.join(root, "packages");

    const configured = resolveTarget(fs, {
      rootDir: root,
      currentWorkingDirectory: cwd,
      given: undefined,
      configured: "packages/ui",
    });
    const fallback = resolveTarget(fs, {
      rootDir: root,
      currentWorkingDirectory: cwd,
      given: undefined,
      configured: undefined,
    });

    expect(configured.ok && configured.value.relativePath).toBe("packages/ui");
    expect(fallback.ok && fallback.value).toMatchObject({ relativePath: ".", isFile: false });
  });

  it("refuses a path that does not exist, or one outside the project root", () => {
    const missing = resolveTarget(fs, {
      rootDir: root,
      currentWorkingDirectory: root,
      given: "nope",
      configured: undefined,
    });
    const outside = resolveTarget(fs, {
      rootDir: path.join(root, "packages"),
      currentWorkingDirectory: root,
      given: "package.json",
      configured: undefined,
    });

    expect(!missing.ok && missing.error.code).toBe("NOT_FOUND");
    expect(!outside.ok && outside.error.code).toBe("VALIDATION_ERROR");
  });
});
