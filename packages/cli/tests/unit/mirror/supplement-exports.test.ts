import { describe, expect, it } from "vitest";

import type { CliFileEncoding, FilesystemPort } from "#/core/filesystem/port";
import { supplementExportsInPackageJson } from "#/mirror/supplement-exports";

function createFilesystemHarness(
  initialPackageJson: Record<string, unknown>,
  existingFiles: Array<string> = [],
): {
  filesystem: FilesystemPort;
  readPackageJson(): Record<string, unknown>;
} {
  const packageJsonPath = "/virtual/package.json";
  const virtualFiles = new Map<string, string>([
    [packageJsonPath, JSON.stringify(initialPackageJson, null, 2) + "\n"],
    ...existingFiles.map((f): [string, string] => [f, ""]),
  ]);

  return {
    filesystem: {
      existsSync: (p) => virtualFiles.has(p),
      canonicalPathSync: (p) => p,
      statSync: () => ({ isDirectory: () => false, isFile: () => true }),
      readFileSync: (p) => virtualFiles.get(p) ?? "",
      writeFileSync: (p, data) => {
        virtualFiles.set(p, data);
      },
      readdirSync: () => [],
      async readFile(p) {
        return virtualFiles.get(p) ?? "";
      },
      async writeFile(p, data, _encoding: CliFileEncoding) {
        virtualFiles.set(p, data);
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
      async unlink(p) {
        virtualFiles.delete(p);
      },
    },
    readPackageJson() {
      return JSON.parse(virtualFiles.get(packageJsonPath) ?? "{}") as Record<string, unknown>;
    },
  };
}

const BASE_OPTIONS = {
  source: true as const,
  types: true,
  import: true,
  resolveSourcePath: (p: string) => `./src/${p}.ts`,
};

describe("supplementExportsInPackageJson", () => {
  it("adds missing source condition to an existing export entry", async () => {
    const harness = createFilesystemHarness({
      name: "@acme/pkg",
      exports: {
        ".": {
          types: "./dist/index.d.mts",
          import: "./dist/index.mjs",
        },
      },
    });

    const result = await supplementExportsInPackageJson(
      harness.filesystem,
      "/virtual/package.json",
      "/virtual",
      BASE_OPTIONS,
    );

    expect(result.supplementedSpecifiers).toEqual(["."]);
    const exports = harness.readPackageJson().exports as Record<string, unknown>;
    expect(exports["."]).toMatchObject({
      source: "./src/index.ts",
      types: "./dist/index.d.mts",
      import: "./dist/index.mjs",
    });
  });

  it("source condition appears before types and import in the written entry", async () => {
    const harness = createFilesystemHarness({
      name: "@acme/pkg",
      exports: { ".": { types: "./dist/index.d.mts", import: "./dist/index.mjs" } },
    });

    await supplementExportsInPackageJson(harness.filesystem, "/virtual/package.json", "/virtual", BASE_OPTIONS);

    const rootEntry = (harness.readPackageJson().exports as Record<string, unknown>)["."] as Record<string, unknown>;
    expect(Object.keys(rootEntry)[0]).toBe("source");
  });

  it("does not change entries that already have source", async () => {
    const harness = createFilesystemHarness({
      name: "@acme/pkg",
      exports: {
        ".": {
          source: "./src/index.ts",
          types: "./dist/index.d.mts",
          import: "./dist/index.mjs",
        },
      },
    });

    const result = await supplementExportsInPackageJson(
      harness.filesystem,
      "/virtual/package.json",
      "/virtual",
      BASE_OPTIONS,
    );

    expect(result.supplementedSpecifiers).toEqual([]);
  });

  it("resolves .tsx extension when resolveSourcePath returns it", async () => {
    const harness = createFilesystemHarness({
      name: "@acme/ui",
      exports: {
        ".": { types: "./dist/index.d.mts", import: "./dist/index.mjs" },
      },
    });

    await supplementExportsInPackageJson(harness.filesystem, "/virtual/package.json", "/virtual", {
      ...BASE_OPTIONS,
      resolveSourcePath: (p) => `./src/${p}.tsx`,
    });

    const rootEntry = (harness.readPackageJson().exports as Record<string, unknown>)["."] as Record<string, unknown>;
    expect(rootEntry.source).toBe("./src/index.tsx");
  });

  it("supplements missing types from dist/ when types option is true", async () => {
    const harness = createFilesystemHarness(
      {
        name: "@acme/pkg",
        exports: { ".": { import: "./dist/index.mjs" } },
      },
      ["/virtual/dist/index.d.mts"],
    );

    await supplementExportsInPackageJson(harness.filesystem, "/virtual/package.json", "/virtual", BASE_OPTIONS);

    const rootEntry = (harness.readPackageJson().exports as Record<string, unknown>)["."] as Record<string, unknown>;
    expect(rootEntry.types).toBe("./dist/index.d.mts");
  });

  it("does not touch string export entries (e.g. ./package.json)", async () => {
    const harness = createFilesystemHarness({
      name: "@acme/pkg",
      exports: {
        ".": { types: "./dist/index.d.mts", import: "./dist/index.mjs" },
        "./package.json": "./package.json",
      },
    });

    await supplementExportsInPackageJson(harness.filesystem, "/virtual/package.json", "/virtual", BASE_OPTIONS);

    const exports = harness.readPackageJson().exports as Record<string, unknown>;
    expect(exports["./package.json"]).toBe("./package.json");
  });
});
