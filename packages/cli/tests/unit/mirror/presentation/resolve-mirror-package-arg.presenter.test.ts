import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { vi } from "vitest";
import { NodeCliFsAdapter } from "#/lib/infrastructure/node-io.adapter";
import { resolveMirrorPackageArgToRelative } from "#/lib/mirror/application/services/mirror-package-arg-resolver.service";

const cliFs = new NodeCliFsAdapter();

describe("resolveMirrorPackageArgToRelative", () => {
  it("returns undefined when arg is undefined", () => {
    const outcome = resolveMirrorPackageArgToRelative({
      fs: cliFs,
      rootDir: "/repo",
      packageArg: undefined,
      currentWorkingDirectory: "/repo",
    });
    expect(outcome).toEqual({ ok: true, value: undefined });
  });

  it("returns a normalized path for a package under the repo root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-pkg-"));
    const pkgDir = path.join(root, "packages", "widget");
    fs.mkdirSync(pkgDir, { recursive: true });
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(root);
    try {
      const rel = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: "packages/widget",
        currentWorkingDirectory: root,
      });
      expect(rel).toEqual({ ok: true, value: "packages/widget" });
      const abs = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: pkgDir,
        currentWorkingDirectory: root,
      });
      expect(abs).toEqual({ ok: true, value: "packages/widget" });
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("rejects '.' and other paths that resolve to the repo root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-root-dot-"));
    fs.mkdirSync(path.join(root, "packages", "x"), { recursive: true });
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(root);
    try {
      const dot = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: ".",
        currentWorkingDirectory: root,
      });
      expect(dot.ok).toBe(false);
      const dotSlash = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: "./",
        currentWorkingDirectory: root,
      });
      expect(dotSlash.ok).toBe(false);
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("rejects paths outside the monorepo root", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-out-"));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-outside-"));
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(root);
    try {
      const outcome = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: outside,
        currentWorkingDirectory: root,
      });
      expect(outcome.ok).toBe(false);
    } finally {
      cwdSpy.mockRestore();
    }
  });
});
