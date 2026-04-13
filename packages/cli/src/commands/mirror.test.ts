import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { packageArgToRelative } from "#commands/mirror";

describe("packageArgToRelative", () => {
  it("returns undefined when arg is undefined", () => {
    expect(packageArgToRelative("/repo", undefined)).toBeUndefined();
  });

  it("returns a normalized path for a package under the repo root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-pkg-"));
    const pkgDir = path.join(root, "packages", "widget");
    fs.mkdirSync(pkgDir, { recursive: true });
    const prev = process.cwd();
    try {
      process.chdir(root);
      expect(packageArgToRelative(root, "packages/widget")).toBe("packages/widget");
      expect(packageArgToRelative(root, pkgDir)).toBe("packages/widget");
    } finally {
      process.chdir(prev);
    }
  });

  it("rejects '.' and other paths that resolve to the repo root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-root-dot-"));
    fs.mkdirSync(path.join(root, "packages", "x"), { recursive: true });
    const prev = process.cwd();
    try {
      process.chdir(root);
      expect(() => packageArgToRelative(root, ".")).toThrow(/subdirectory under monorepo root/);
      expect(() => packageArgToRelative(root, "./")).toThrow(/subdirectory under monorepo root/);
    } finally {
      process.chdir(prev);
    }
  });

  it("rejects paths outside the monorepo root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-out-"));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-outside-"));
    const prev = process.cwd();
    try {
      process.chdir(root);
      expect(() => packageArgToRelative(root, outside)).toThrow(/subdirectory under monorepo root/);
    } finally {
      process.chdir(prev);
    }
  });
});
