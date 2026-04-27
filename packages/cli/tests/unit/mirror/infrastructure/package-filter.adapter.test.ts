import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";
import { resolvePackageFilterUnderRoot } from "#/lib/mirror/infrastructure/package-filter.util";

describe("resolvePackageFilterUnderRoot", () => {
  it("normalizes a path relative to rootDir (not cwd)", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-filter-root-"));
    const pkgDir = path.join(root, "packages", "widget");
    fs.mkdirSync(pkgDir, { recursive: true });
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(os.tmpdir());
    try {
      expect(resolvePackageFilterUnderRoot(root, "packages/widget")).toBe("packages/widget");
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("accepts absolute paths under the repo root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-filter-abs-"));
    const pkgDir = path.join(root, "packages", "ui");
    fs.mkdirSync(pkgDir, { recursive: true });
    expect(resolvePackageFilterUnderRoot(root, pkgDir)).toBe("packages/ui");
  });

  it("rejects paths outside the monorepo root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-filter-out-"));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-filter-outside-"));
    expect(() => resolvePackageFilterUnderRoot(root, outside)).toThrow(
      /subdirectory under monorepo root/,
    );
  });
});
