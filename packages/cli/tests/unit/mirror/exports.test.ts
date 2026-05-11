import { describe, expect, it } from "vitest";
import type { DistFilesystem } from "#/mirror/domain/dist-filesystem";
import { generateExports } from "#/mirror/domain/exports";
import { writePackageJsonExportsAtomic } from "#/mirror/write-exports";
import type { CliFileEncoding, FilesystemPort } from "#/core/filesystem/port";

function createDistFilesystem(files: Array<string>): DistFilesystem {
  return {
    async listRelativeFilesRecursively() {
      return files;
    },
    async isDirectoryCssOnly() {
      return false;
    },
  };
}

function createPackageJsonFilesystem(initialPackageJson: Record<string, unknown>): {
  fs: FilesystemPort;
  readPackageJson(): Record<string, unknown>;
} {
  const packageJsonPath = "/virtual/package.json";
  const files = new Map<string, string>([
    [packageJsonPath, JSON.stringify(initialPackageJson, null, 2) + "\n"],
  ]);

  return {
    fs: {
      existsSync(filePath) {
        return files.has(filePath);
      },
      canonicalPathSync(inputPath) {
        return inputPath;
      },
      statSync() {
        return {
          isDirectory: () => false,
          isFile: () => true,
        };
      },
      readFileSync(filePath) {
        return files.get(filePath) ?? "";
      },
      writeFileSync(filePath, data) {
        files.set(filePath, data);
      },
      readdirSync() {
        return [];
      },
      async readFile(filePath) {
        return files.get(filePath) ?? "";
      },
      async writeFile(filePath, data, _encoding: CliFileEncoding) {
        files.set(filePath, data);
      },
      async readdir() {
        return [];
      },
      async rename(oldPath, newPath) {
        const data = files.get(oldPath);
        if (data === undefined) {
          throw new Error(`Missing temp file: ${oldPath}`);
        }
        files.set(newPath, data);
        files.delete(oldPath);
      },
      async unlink(filePath) {
        files.delete(filePath);
      },
    },
    readPackageJson() {
      return JSON.parse(files.get(packageJsonPath) ?? "{}") as Record<string, unknown>;
    },
  };
}

describe("mirror export generation", () => {
  it("generates import entries for JavaScript modules without declarations", async () => {
    const result = await generateExports(
      createDistFilesystem([
        "index.mjs",
        "child/fingerprint.mjs",
        "server/client/chunks/react-vendor-abc123.js",
      ]),
      "/virtual/dist",
      null,
      false,
      {},
    );

    expect(result.jsCount).toBe(2);
    expect(result.exports).toEqual({
      ".": {
        import: "./dist/index.mjs",
      },
      "./child/fingerprint": {
        import: "./dist/child/fingerprint.mjs",
      },
      "./package.json": "./package.json",
    });
    expect(result.exports).not.toHaveProperty("./server/client/chunks/react-vendor-abc123");
  });

  it("adds types conditions when declaration files exist", async () => {
    const result = await generateExports(
      createDistFilesystem(["index.mjs", "index.d.mts"]),
      "/virtual/dist",
      null,
      false,
      {},
    );

    expect(result.exports["."]).toEqual({
      types: "./dist/index.d.mts",
      import: "./dist/index.mjs",
    });
  });

  it("preserves top-level types when generated root export has no types condition", async () => {
    const packageJsonFilesystem = createPackageJsonFilesystem({
      name: "virtual-package",
      type: "module",
      types: "./dist/index.d.mts",
      exports: {
        "./package.json": "./package.json",
      },
    });

    await writePackageJsonExportsAtomic(packageJsonFilesystem.fs, "/virtual/package.json", {
      generatedExports: {
        ".": {
          import: "./dist/index.mjs",
        },
        "./package.json": "./package.json",
      },
      managedExportSpecifiers: [".", "./package.json"],
      originalPathBySpecifier: {
        ".": ".",
        "./package.json": "./package.json",
      },
    });

    const packageJson = packageJsonFilesystem.readPackageJson();
    expect(packageJson.types).toBe("./dist/index.d.mts");
    expect(packageJson.main).toBe("./dist/index.mjs");
    expect(packageJson.module).toBe("./dist/index.mjs");
    expect(packageJson.exports).toEqual({
      ".": {
        import: "./dist/index.mjs",
      },
      "./package.json": "./package.json",
    });
  });
});
