import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { createNodeCliFs } from "#lib/infra/node-io.adapter";
import { resolveMirrorPackageArgToRelative } from "#lib/mirror/presentation/resolve-mirror-package-arg.presenter";

const cliFs = createNodeCliFs();

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
    const prev = process.cwd();
    try {
      process.chdir(root);
      const rel = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: "packages/widget",
        currentWorkingDirectory: process.cwd(),
      });
      expect(rel).toEqual({ ok: true, value: "packages/widget" });
      const abs = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: pkgDir,
        currentWorkingDirectory: process.cwd(),
      });
      expect(abs).toEqual({ ok: true, value: "packages/widget" });
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
      const dot = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: ".",
        currentWorkingDirectory: process.cwd(),
      });
      expect(dot.ok).toBe(false);
      const dotSlash = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: "./",
        currentWorkingDirectory: process.cwd(),
      });
      expect(dotSlash.ok).toBe(false);
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
      const outcome = resolveMirrorPackageArgToRelative({
        fs: cliFs,
        rootDir: root,
        packageArg: outside,
        currentWorkingDirectory: process.cwd(),
      });
      expect(outcome.ok).toBe(false);
    } finally {
      process.chdir(prev);
    }
  });
});
