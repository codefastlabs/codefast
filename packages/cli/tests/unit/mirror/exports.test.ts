import { describe, expect, it } from "vitest";
import type { DistFilesystem } from "#/mirror/domain/dist-filesystem";
import { generateExports } from "#/mirror/domain/exports";
import { writePackageJsonExportsAtomic } from "#/mirror/write-exports";
import type { CliFileEncoding, FilesystemPort } from "#/core/filesystem/port";

function createDistFilesystemStub(files: Array<string>): DistFilesystem {
  return {
    async listRelativeFilesRecursively() {
      return files;
    },
    async isDirectoryCssOnly() {
      return false;
    },
  };
}

function createPackageJsonFilesystemHarness(initialPackageJson: Record<string, unknown>): {
  filesystem: FilesystemPort;
  readPackageJson(): Record<string, unknown>;
} {
  const packageJsonPath = "/virtual/package.json";
  const virtualFiles = new Map<string, string>([
    [packageJsonPath, JSON.stringify(initialPackageJson, null, 2) + "\n"],
  ]);

  return {
    filesystem: {
      existsSync(filePath) {
        return virtualFiles.has(filePath);
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
        return virtualFiles.get(filePath) ?? "";
      },
      writeFileSync(filePath, data) {
        virtualFiles.set(filePath, data);
      },
      readdirSync() {
        return [];
      },
      async readFile(filePath) {
        return virtualFiles.get(filePath) ?? "";
      },
      async writeFile(filePath, data, _encoding: CliFileEncoding) {
        virtualFiles.set(filePath, data);
      },
      async readdir() {
        return [];
      },
      async rename(oldPath, newPath) {
        const data = virtualFiles.get(oldPath);
        if (data === undefined) {
          throw new Error(`Missing temp file: ${oldPath}`);
        }
        virtualFiles.set(newPath, data);
        virtualFiles.delete(oldPath);
      },
      async unlink(filePath) {
        virtualFiles.delete(filePath);
      },
    },
    readPackageJson() {
      return JSON.parse(virtualFiles.get(packageJsonPath) ?? "{}") as Record<string, unknown>;
    },
  };
}

describe("mirror export generation", () => {
  it("generates import entries for JavaScript modules without declarations", async () => {
    const generatedExports = await generateExports(
      createDistFilesystemStub([
        "index.mjs",
        "child/fingerprint.mjs",
        "server/client/chunks/react-vendor-abc123.js",
      ]),
      "/virtual/dist",
      null,
      false,
      {},
    );

    expect(generatedExports.jsCount).toBe(2);
    expect(generatedExports.exports).toEqual({
      ".": {
        import: "./dist/index.mjs",
      },
      "./child/fingerprint": {
        import: "./dist/child/fingerprint.mjs",
      },
      "./package.json": "./package.json",
    });
    expect(generatedExports.exports).not.toHaveProperty(
      "./server/client/chunks/react-vendor-abc123",
    );
  });

  it("adds types conditions when declaration files exist", async () => {
    const generatedExports = await generateExports(
      createDistFilesystemStub(["index.mjs", "index.d.mts"]),
      "/virtual/dist",
      null,
      false,
      {},
    );

    expect(generatedExports.exports["."]).toEqual({
      types: "./dist/index.d.mts",
      import: "./dist/index.mjs",
    });
  });

  it("preserves top-level types when generated root export has no types condition", async () => {
    const packageJsonHarness = createPackageJsonFilesystemHarness({
      name: "virtual-package",
      type: "module",
      types: "./dist/index.d.mts",
      exports: {
        "./package.json": "./package.json",
      },
    });

    await writePackageJsonExportsAtomic(packageJsonHarness.filesystem, "/virtual/package.json", {
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

    const packageJson = packageJsonHarness.readPackageJson();
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
