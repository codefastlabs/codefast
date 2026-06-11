import { describe, expect, it } from "vitest";

import { mirrorConfigSchema } from "#/core/config/schema";
import type { CliFileEncoding, FilesystemPort } from "#/core/filesystem/port";
import type { DistFilesystem } from "#/mirror/domain/dist-filesystem";
import { createPathTransform, generateExports } from "#/mirror/domain/exports";
import { writePackageJsonExportsAtomic } from "#/mirror/write-exports";

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
  const virtualFiles = new Map<string, string>([[packageJsonPath, JSON.stringify(initialPackageJson, null, 2) + "\n"]]);

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

describe("mirrorConfigSchema", () => {
  it("parses per-package config with defaults applied", () => {
    const result = mirrorConfigSchema.safeParse({
      "@codefast/ui": {
        strip: "./components/",
        exports: { "./css/*": "./src/css/*" },
      },
      "@apps/web": false,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const ui = result.data["@codefast/ui"];
    expect(ui).not.toBe(false);
    if (!ui) {
      return;
    }
    expect(ui.source).toBe(true);
    expect(ui.types).toBe(true);
    expect(ui.import).toBe(true);
    expect(result.data["@apps/web"]).toBe(false);
  });

  it("accepts explicit source path override", () => {
    const result = mirrorConfigSchema.safeParse({
      "@codefast/ui": { source: "./src/index.tsx" },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    const ui = result.data["@codefast/ui"];
    expect(ui).not.toBe(false);
    if (!ui) {
      return;
    }
    expect(ui.source).toBe("./src/index.tsx");
  });

  it("rejects unknown keys in package config", () => {
    const result = mirrorConfigSchema.safeParse({
      "@codefast/ui": { unknownField: true },
    });

    expect(result.success).toBe(false);
  });
});

describe("createPathTransform", () => {
  it("returns null when no strip provided", () => {
    expect(createPathTransform(undefined)).toBeNull();
  });

  it("strips the configured prefix", () => {
    const transform = createPathTransform("./components/");
    expect(transform).not.toBeNull();
    expect(transform!("./components/button")).toBe("./button");
    expect(transform!("./utils/math")).toBe("./utils/math");
  });
});

describe("mirror export generation", () => {
  it("generates import entries for JavaScript modules without declarations", async () => {
    const generatedExports = await generateExports(
      createDistFilesystemStub(["index.mjs", "child/fingerprint.mjs", "server/client/chunks/react-vendor-abc123.js"]),
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
    expect(generatedExports.exports).not.toHaveProperty("./server/client/chunks/react-vendor-abc123");
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

  it("adds source condition when source option is true — defaults to .ts extension", async () => {
    const generatedExports = await generateExports(
      createDistFilesystemStub(["index.mjs", "index.d.mts", "components/button.mjs"]),
      "/virtual/dist",
      null,
      false,
      {},
      { source: true },
    );

    expect(generatedExports.exports["."]).toEqual({
      source: "./src/index.ts",
      types: "./dist/index.d.mts",
      import: "./dist/index.mjs",
    });
    expect(generatedExports.exports["./components/button"]).toEqual({
      source: "./src/components/button.ts",
      import: "./dist/components/button.mjs",
    });
  });

  it("uses resolveSourcePath to detect .tsx extension", async () => {
    const tsxModules = new Set(["components/button", "components/input"]);
    const resolveSourcePath = (modulePath: string) =>
      tsxModules.has(modulePath) ? `./src/${modulePath}.tsx` : `./src/${modulePath}.ts`;

    const generatedExports = await generateExports(
      createDistFilesystemStub(["index.mjs", "components/button.mjs", "components/input.mjs", "utils/cn.mjs"]),
      "/virtual/dist",
      null,
      false,
      {},
      { source: true, resolveSourcePath },
    );

    expect(generatedExports.exports["."]).toMatchObject({ source: "./src/index.ts" });
    expect(generatedExports.exports["./components/button"]).toMatchObject({
      source: "./src/components/button.tsx",
    });
    expect(generatedExports.exports["./components/input"]).toMatchObject({
      source: "./src/components/input.tsx",
    });
    expect(generatedExports.exports["./utils/cn"]).toMatchObject({ source: "./src/utils/cn.ts" });
  });

  it("uses explicit string path for root source condition", async () => {
    const generatedExports = await generateExports(
      createDistFilesystemStub(["index.mjs"]),
      "/virtual/dist",
      null,
      false,
      {},
      { source: "./src/index.tsx" },
    );

    expect(generatedExports.exports["."]).toEqual({
      source: "./src/index.tsx",
      import: "./dist/index.mjs",
    });
  });

  it("omits types condition when types option is false", async () => {
    const generatedExports = await generateExports(
      createDistFilesystemStub(["index.mjs", "index.d.mts"]),
      "/virtual/dist",
      null,
      false,
      {},
      { types: false },
    );

    expect(generatedExports.exports["."]).toEqual({
      import: "./dist/index.mjs",
    });
    expect(generatedExports.exports["."]).not.toHaveProperty("types");
  });

  it("omits import condition when import option is false", async () => {
    const generatedExports = await generateExports(
      createDistFilesystemStub(["index.mjs", "index.d.mts"]),
      "/virtual/dist",
      null,
      false,
      {},
      { import: false },
    );

    expect(generatedExports.exports["."]).toEqual({
      types: "./dist/index.d.mts",
    });
    expect(generatedExports.exports["."]).not.toHaveProperty("import");
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
