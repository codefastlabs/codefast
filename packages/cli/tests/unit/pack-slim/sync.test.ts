import path from "node:path";

import { describe, expect, it } from "vitest";

import type { DirectoryEntry, FilesystemPort } from "#/core/filesystem/port";
import { runPackSlim } from "#/pack-slim/sync";

function createFakeRepo(files: Record<string, string>): {
  readonly fs: FilesystemPort;
  readonly store: Map<string, string>;
} {
  const store = new Map<string, string>(Object.entries(files));
  const isDir = (candidate: string): boolean => [...store.keys()].some((key) => key.startsWith(`${candidate}/`));
  const fs: FilesystemPort = {
    existsSync: (filePath) => store.has(filePath) || isDir(filePath),
    canonicalPathSync: (inputPath) => inputPath,
    statSync: (filePath) => ({ isDirectory: () => isDir(filePath), isFile: () => store.has(filePath) }),
    readFileSync: (filePath) => {
      const found = store.get(filePath);
      if (found === undefined) {
        throw new Error(`missing ${filePath}`);
      }
      return found;
    },
    writeFileSync: (filePath, data) => {
      store.set(filePath, data);
    },
    readdirSync: () => [],
    readFile: async (filePath) => {
      const found = store.get(filePath);
      if (found === undefined) {
        throw new Error(`missing ${filePath}`);
      }
      return found;
    },
    writeFile: async (filePath, data) => {
      store.set(filePath, data);
    },
    readdir: async (dirPath): Promise<Array<DirectoryEntry>> =>
      [...store.keys()]
        .filter((key) => key.startsWith(`${dirPath}/`))
        .map((key) => ({
          name: path.basename(key),
          parentPath: path.dirname(key),
          isFile: () => true,
          isDirectory: () => false,
        })),
    rename: async () => {},
    unlink: async (filePath) => {
      store.delete(filePath);
    },
  };
  return { fs, store };
}

const ROOT = "/repo";
const PKG = `${ROOT}/packages/di`;

function seedPackage(): Record<string, string> {
  return {
    [`${PKG}/package.json`]: `${JSON.stringify(
      {
        name: "@codefast/di",
        files: ["dist", "src", "README.md"],
        exports: { ".": { source: "./src/index.ts", types: "./dist/index.d.ts", import: "./dist/index.js" } },
        imports: { "#/*": { source: ["./src/*"], types: "./dist/*.d.ts", default: "./dist/*.js" } },
      },
      null,
      2,
    )}\n`,
    [`${PKG}/dist/index.js`]: "export const x = 1;\n//# sourceMappingURL=index.js.map\n",
    [`${PKG}/dist/index.js.map`]: "{}",
    [`${PKG}/dist/index.d.ts`]: "export declare const x: number;\n//# sourceMappingURL=index.d.ts.map\n",
    [`${PKG}/dist/index.d.ts.map`]: "{}",
    [`${PKG}/dist/core/token.js`]: "export const t = 1;\n//# sourceMappingURL=token.js.map\n",
    [`${PKG}/dist/core/token.js.map`]: "{}",
  };
}

describe("runPackSlim", () => {
  it("strips src, source conditions, and dist maps for a single package", async () => {
    const { fs, store } = createFakeRepo(seedPackage());

    const outcome = await runPackSlim(fs, { rootDir: ROOT, packageFilter: "packages/di", write: true });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    const manifest = JSON.parse(store.get(`${PKG}/package.json`)!) as Record<string, unknown>;
    expect(manifest.files).toEqual(["dist", "README.md"]);
    expect(manifest.exports).toEqual({ ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } });
    expect(manifest.imports).toEqual({ "#/*": { types: "./dist/*.d.ts", default: "./dist/*.js" } });

    expect(store.has(`${PKG}/dist/index.js.map`)).toBe(false);
    expect(store.has(`${PKG}/dist/index.d.ts.map`)).toBe(false);
    expect(store.has(`${PKG}/dist/core/token.js.map`)).toBe(false);
    expect(store.get(`${PKG}/dist/index.js`)).not.toContain("sourceMappingURL");
    expect(store.get(`${PKG}/dist/core/token.js`)).not.toContain("sourceMappingURL");

    const stats = outcome.value;
    expect(stats.packagesProcessed).toBe(1);
    expect(stats.packagesChanged).toBe(1);
    expect(stats.totalMapFilesDeleted).toBe(3);
    expect(stats.packageDetails[0]?.sourceCommentsStripped).toBe(3);
  });

  it("touches nothing under --dry-run but still reports what it would drop", async () => {
    const { fs, store } = createFakeRepo(seedPackage());
    const before = new Map(store);

    const outcome = await runPackSlim(fs, { rootDir: ROOT, packageFilter: "packages/di", write: false });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect([...store.entries()]).toEqual([...before.entries()]);
    expect(outcome.value.totalMapFilesDeleted).toBe(3);
    expect(outcome.value.packagesChanged).toBe(1);
  });

  it("skips a private package", async () => {
    const { fs } = createFakeRepo({
      [`${PKG}/package.json`]: JSON.stringify({
        name: "@codefast/benchmark-di",
        private: true,
        files: ["dist", "src"],
      }),
    });

    const outcome = await runPackSlim(fs, { rootDir: ROOT, packageFilter: "packages/di", write: true });

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      return;
    }
    expect(outcome.value.packagesSkipped).toBe(1);
    expect(outcome.value.packageDetails[0]?.skipReason).toBe("private package");
  });
});
