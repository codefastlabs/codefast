import { describe, expect, it } from "vitest";

import {
  isMapAnnotatedFile,
  isSourceMapFile,
  slimPublishManifest,
  stripSourceMappingComment,
} from "#/pack-slim/domain/transform";

describe("slimPublishManifest", () => {
  it("drops src from files, and every source condition from exports and imports", () => {
    const manifest = {
      name: "@codefast/di",
      files: ["dist", "src", "README.md"],
      exports: {
        ".": { source: "./src/index.ts", types: "./dist/index.d.ts", import: "./dist/index.js" },
        "./button": { source: "./src/button.ts", types: "./dist/button.d.ts", import: "./dist/button.js" },
        "./package.json": "./package.json",
      },
      imports: {
        "#/*": { source: ["./src/*", "./src/*.ts"], types: "./dist/*.d.ts", default: "./dist/*.js" },
        "#/tests/*": ["./tests/*"],
      },
    };

    const { manifest: slimmed, report } = slimPublishManifest(manifest);

    expect(slimmed.files).toEqual(["dist", "README.md"]);
    expect(slimmed.exports).toEqual({
      ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
      "./button": { types: "./dist/button.d.ts", import: "./dist/button.js" },
      "./package.json": "./package.json",
    });
    expect(slimmed.imports).toEqual({
      "#/*": { types: "./dist/*.d.ts", default: "./dist/*.js" },
      "#/tests/*": ["./tests/*"],
    });
    expect(report).toEqual({
      filesSrcRemoved: true,
      exportsSourceRemoved: 2,
      importsSourceRemoved: 1,
      changed: true,
    });
  });

  it("leaves the caller's manifest untouched", () => {
    const manifest = { files: ["dist", "src"], exports: { ".": { source: "./src/index.ts" } } };

    slimPublishManifest(manifest);

    expect(manifest.files).toEqual(["dist", "src"]);
    expect(manifest.exports["."].source).toBe("./src/index.ts");
  });

  it("reports no change for an already-slim manifest", () => {
    const { report } = slimPublishManifest({
      files: ["dist"],
      exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } },
    });

    expect(report.changed).toBe(false);
    expect(report.filesSrcRemoved).toBe(false);
    expect(report.exportsSourceRemoved).toBe(0);
  });
});

describe("stripSourceMappingComment", () => {
  it("removes the trailing sourceMappingURL directive", () => {
    const { text, stripped } = stripSourceMappingComment("export const x = 1;\n//# sourceMappingURL=x.js.map\n");

    expect(stripped).toBe(true);
    expect(text).not.toContain("sourceMappingURL");
  });

  it("leaves a file with no directive unchanged", () => {
    const source = "export const x = 1;\n";
    const { text, stripped } = stripSourceMappingComment(source);

    expect(stripped).toBe(false);
    expect(text).toBe(source);
  });
});

describe("dist entry predicates", () => {
  it("classifies source-map sidecars", () => {
    expect(isSourceMapFile("index.js.map")).toBe(true);
    expect(isSourceMapFile("index.d.ts.map")).toBe(true);
    expect(isSourceMapFile("index.js")).toBe(false);
  });

  it("classifies map-annotated emitted files", () => {
    expect(isMapAnnotatedFile("index.js")).toBe(true);
    expect(isMapAnnotatedFile("index.d.ts")).toBe(true);
    expect(isMapAnnotatedFile("index.js.map")).toBe(false);
    expect(isMapAnnotatedFile("styles.css")).toBe(false);
  });
});
