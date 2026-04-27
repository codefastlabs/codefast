import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NodeCliFsAdapter } from "#/lib/infra/node-io.adapter";
import { resolveArrangeTargetPath as resolveArrangeCliTargetPath } from "#/lib/arrange/application/use-cases/prepare-arrange-workspace.use-case";

const cliFs = new NodeCliFsAdapter();

describe("resolveArrangeTargetPath", () => {
  it("returns canonical explicit target resolved from cwd", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "arrange-explicit-"));
    const sourceDir = path.join(rootDir, "src");
    fs.mkdirSync(sourceDir, { recursive: true });
    const resolvedTargetPath = resolveArrangeCliTargetPath({
      fs: cliFs,
      currentWorkingDirectory: rootDir,
      rawTarget: "./src",
    });
    expect(resolvedTargetPath).toBe(cliFs.canonicalPathSync(sourceDir));
  });

  it("auto-detects nearest package directory via package.json when target is missing", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "arrange-nearest-pkg-"));
    const packageDirectory = path.join(rootDir, "packages", "widget");
    const nestedCurrentWorkingDirectory = path.join(packageDirectory, "src", "components");
    fs.mkdirSync(nestedCurrentWorkingDirectory, { recursive: true });
    fs.writeFileSync(path.join(packageDirectory, "package.json"), '{"name":"widget"}', "utf8");
    const resolvedTargetPath = resolveArrangeCliTargetPath({
      fs: cliFs,
      currentWorkingDirectory: nestedCurrentWorkingDirectory,
      rawTarget: undefined,
    });
    expect(resolvedTargetPath).toBe(cliFs.canonicalPathSync(packageDirectory));
  });

  it("falls back to cwd when no package.json exists in parent chain", () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "arrange-cwd-fallback-"));
    const nestedCurrentWorkingDirectory = path.join(rootDir, "scratch", "feature");
    fs.mkdirSync(nestedCurrentWorkingDirectory, { recursive: true });
    const resolvedTargetPath = resolveArrangeCliTargetPath({
      fs: cliFs,
      currentWorkingDirectory: nestedCurrentWorkingDirectory,
      rawTarget: undefined,
    });
    expect(resolvedTargetPath).toBe(cliFs.canonicalPathSync(nestedCurrentWorkingDirectory));
  });
});
