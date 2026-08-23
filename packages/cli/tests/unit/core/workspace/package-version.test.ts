import path from "node:path";

import { describe, expect, it } from "vitest";

import type { FilesystemPort } from "#/core/filesystem/port";
import { findNearestPackageVersion } from "#/core/workspace/package-version";

const rootDir = path.join(path.sep, "repo");

function createFilesystem(files: Record<string, string>): FilesystemPort {
  const contents = new Map(Object.entries(files).map(([filePath, content]) => [path.normalize(filePath), content]));

  return {
    existsSync: (filePath) => contents.has(path.normalize(filePath)),
    canonicalPathSync: (inputPath) => path.normalize(inputPath),
    statSync: (filePath) => {
      const normalizedPath = path.normalize(filePath);
      if (contents.has(normalizedPath)) {
        return { isDirectory: () => false, isFile: () => true };
      }
      return { isDirectory: () => true, isFile: () => false };
    },
    readFileSync: (filePath) => {
      const content = contents.get(path.normalize(filePath));
      if (content === undefined) {
        throw new Error(`missing file: ${filePath}`);
      }
      return content;
    },
    writeFileSync: () => {
      throw new Error("unexpected write");
    },
    readdirSync: () => [],
    readFile: () => Promise.reject(new Error("unexpected async read")),
    writeFile: () => Promise.reject(new Error("unexpected async write")),
    readdir: () => Promise.reject(new Error("unexpected async readdir")),
    rename: () => Promise.reject(new Error("unexpected rename")),
    unlink: () => Promise.reject(new Error("unexpected unlink")),
  };
}

describe("findNearestPackageVersion", () => {
  it("returns the nearest enclosing package version", () => {
    const fs = createFilesystem({
      [path.join(rootDir, "package.json")]: "{}",
      [path.join(rootDir, "packages", "ui", "package.json")]: '{"version":"0.7.0"}',
      [path.join(rootDir, "packages", "ui", "src", "button.tsx")]: "export const a = 1;",
    });

    expect(findNearestPackageVersion(fs, path.join(rootDir, "packages", "ui", "src", "button.tsx"))).toBe("0.7.0");
  });

  it("returns null when the first package.json found declares no version", () => {
    const fs = createFilesystem({
      [path.join(rootDir, "package.json")]: '{"name":"codefast"}',
      [path.join(rootDir, "scripts", "task.ts")]: "export const a = 1;",
    });

    expect(findNearestPackageVersion(fs, path.join(rootDir, "scripts", "task.ts"))).toBeNull();
  });

  it("returns null when no package.json exists on the path", () => {
    const fs = createFilesystem({
      [path.join(rootDir, "src", "loose.ts")]: "export const a = 1;",
    });

    expect(findNearestPackageVersion(fs, path.join(rootDir, "src", "loose.ts"))).toBeNull();
  });
});
