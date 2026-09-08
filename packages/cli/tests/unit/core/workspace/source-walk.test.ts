import path from "node:path";

import { describe, expect, it } from "vitest";

import type { FilesystemPort } from "#/core/filesystem/port";
import { sourceCommentLanguage, walkSourceFiles } from "#/core/workspace/source-walk";

describe("sourceCommentLanguage", () => {
  it("maps each recognised extension to its comment syntax", () => {
    expect(sourceCommentLanguage("/x/button.ts")).toBe("js");
    expect(sourceCommentLanguage("/x/button.tsx")).toBe("js");
    expect(sourceCommentLanguage("/x/theme.css")).toBe("css");
  });

  it("excludes emitted declarations", () => {
    expect(sourceCommentLanguage("/x/button.d.ts")).toBeNull();
  });

  it("recognises the ignore-file family and nothing else", () => {
    for (const name of [".gitignore", ".dockerignore", ".npmignore", ".prettierignore", ".eslintignore"]) {
      expect(sourceCommentLanguage(`/x/${name}`)).toBe("ignore");
    }
    expect(sourceCommentLanguage("/x/.env")).toBeNull();
    expect(sourceCommentLanguage("/x/readme.md")).toBeNull();
  });
});

describe("walkSourceFiles", () => {
  it("collects convention-bearing files and skips vendored trees", () => {
    const root = path.join(path.sep, "repo");
    const fs = createWalkFilesystem([
      path.join(root, "src", "button.tsx"),
      path.join(root, ".gitignore"),
      path.join(root, "readme.md"),
      path.join(root, "node_modules", "pkg", "index.ts"),
    ]);

    const found = new Set(walkSourceFiles(root, fs).map((filePath) => path.normalize(filePath)));

    expect(found.has(path.normalize(path.join(root, "src", "button.tsx")))).toBe(true);
    expect(found.has(path.normalize(path.join(root, ".gitignore")))).toBe(true);
    expect(found.has(path.normalize(path.join(root, "readme.md")))).toBe(false);
    expect(found.has(path.normalize(path.join(root, "node_modules", "pkg", "index.ts")))).toBe(false);
  });
});

function createWalkFilesystem(filePaths: Array<string>): FilesystemPort {
  const files = new Set(filePaths.map((filePath) => path.normalize(filePath)));

  return {
    existsSync: (filePath) => files.has(path.normalize(filePath)),
    canonicalPathSync: (inputPath) => path.normalize(inputPath),
    globSync: () => [],
    statSync: (filePath) => {
      const normalized = path.normalize(filePath);
      if (files.has(normalized)) {
        return { isDirectory: () => false, isFile: () => true };
      }
      const hasChild = [...files].some((candidate) => candidate.startsWith(normalized + path.sep));
      if (hasChild) {
        return { isDirectory: () => true, isFile: () => false };
      }
      throw new Error(`missing path: ${filePath}`);
    },
    readdirSync: (directoryPath) => {
      const normalized = path.normalize(directoryPath);
      const prefix = normalized.endsWith(path.sep) ? normalized : normalized + path.sep;
      const names = new Set<string>();
      for (const filePath of files) {
        if (filePath.startsWith(prefix)) {
          const name = filePath.slice(prefix.length).split(path.sep)[0];
          if (name !== undefined && name.length > 0) {
            names.add(name);
          }
        }
      }
      return [...names];
    },
    readFileSync: () => {
      throw new Error("unexpected read");
    },
    writeFileSync: () => {
      throw new Error("unexpected write");
    },
    readFile: () => Promise.reject(new Error("unexpected async read")),
    writeFile: () => Promise.reject(new Error("unexpected async write")),
    readdir: () => Promise.reject(new Error("unexpected async readdir")),
    rename: () => Promise.reject(new Error("unexpected rename")),
    unlink: () => Promise.reject(new Error("unexpected unlink")),
  };
}
