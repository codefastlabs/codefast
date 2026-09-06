import { describe, expect, it } from "vitest";

import {
  isLifecycleScript,
  isMapAnnotatedFile,
  isSourceMapFile,
  slimPublishManifest,
  stripSourceMappingComment,
} from "#/pack-slim/domain/transform";

describe("slimPublishManifest", () => {
  it("drops src, source conditions, unshipped imports, dev-only scripts, and devDependencies", () => {
    const manifest = {
      name: "@codefast/di",
      files: ["dist", "src", "README.md"],
      exports: {
        ".": { source: "./src/index.ts", types: "./dist/index.d.ts", import: "./dist/index.js" },
        "./button": { source: "./src/button.ts", types: "./dist/button.d.ts", import: "./dist/button.js" },
        "./package.json": "./package.json",
      },
      imports: {
        "#/tests/*": ["./tests/*", "./tests/*.ts"],
        "#/examples/*": ["./examples/*"],
        "#/*": { source: ["./src/*", "./src/*.ts"], types: "./dist/*.d.ts", default: "./dist/*.js" },
      },
      scripts: { build: "tsc -p tsconfig.build.json", test: "vitest run", postinstall: "node setup.js" },
      devDependencies: { typescript: "^7.0.2", vitest: "^5.0.0" },
    };

    const { manifest: slimmed, report } = slimPublishManifest(manifest);

    expect(slimmed.files).toEqual(["dist", "README.md"]);
    expect(slimmed.exports).toEqual({
      ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
      "./button": { types: "./dist/button.d.ts", import: "./dist/button.js" },
      "./package.json": "./package.json",
    });
    expect(slimmed.imports).toEqual({ "#/*": { types: "./dist/*.d.ts", default: "./dist/*.js" } });
    expect(slimmed.scripts).toEqual({ postinstall: "node setup.js" });
    expect(slimmed).not.toHaveProperty("devDependencies");
    expect(report).toEqual({
      filesSrcRemoved: true,
      exportsSourceRemoved: 2,
      importsSourceRemoved: 1,
      importsUnshippedRemoved: 2,
      scriptsRemoved: 2,
      devDependenciesRemoved: 2,
      changed: true,
    });
  });

  it("drops an imports entry whose only lane was source, and the field once it is empty", () => {
    const { manifest: slimmed, report } = slimPublishManifest({
      files: ["dist", "src"],
      imports: { "#/*": { source: "./src/*" } },
    });

    expect(slimmed).not.toHaveProperty("imports");
    expect(report.importsSourceRemoved).toBe(1);
    expect(report.importsUnshippedRemoved).toBe(1);
  });

  it("keeps an imports entry a glob files entry may ship", () => {
    const manifest = { files: ["*.json", "lib"], imports: { "#/presets/*": "./presets/*.json" } };

    const { manifest: slimmed, report } = slimPublishManifest(manifest);

    expect(slimmed.imports).toEqual(manifest.imports);
    expect(report.importsUnshippedRemoved).toBe(0);
  });

  it("keeps every imports entry when the manifest declares no files", () => {
    const manifest = { imports: { "#/tests/*": "./tests/*" } };

    const { manifest: slimmed, report } = slimPublishManifest(manifest);

    expect(slimmed.imports).toEqual(manifest.imports);
    expect(report.changed).toBe(false);
  });

  it("drops the scripts field once no lifecycle hook remains", () => {
    const { manifest: slimmed, report } = slimPublishManifest({ scripts: { build: "tsc", test: "vitest run" } });

    expect(slimmed).not.toHaveProperty("scripts");
    expect(report.scriptsRemoved).toBe(2);
    expect(report.changed).toBe(true);
  });

  it("leaves the caller's manifest untouched", () => {
    const manifest = {
      files: ["dist", "src"],
      exports: { ".": { source: "./src/index.ts" } },
      imports: { "#/tests/*": "./tests/*" },
      scripts: { build: "tsc" },
      devDependencies: { typescript: "^7.0.2" },
    };

    slimPublishManifest(manifest);

    expect(manifest.files).toEqual(["dist", "src"]);
    expect(manifest.exports["."].source).toBe("./src/index.ts");
    expect(manifest.imports["#/tests/*"]).toBe("./tests/*");
    expect(manifest.scripts.build).toBe("tsc");
    expect(manifest.devDependencies.typescript).toBe("^7.0.2");
  });

  it("reports no change for an already-slim manifest", () => {
    const { report } = slimPublishManifest({
      files: ["dist"],
      exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } },
      imports: { "#/*": { types: "./dist/*.d.ts", default: "./dist/*.js" } },
      scripts: { postinstall: "node setup.js" },
    });

    expect(report.changed).toBe(false);
    expect(report.filesSrcRemoved).toBe(false);
    expect(report.exportsSourceRemoved).toBe(0);
    expect(report.importsUnshippedRemoved).toBe(0);
    expect(report.scriptsRemoved).toBe(0);
    expect(report.devDependenciesRemoved).toBe(0);
  });
});

describe("isLifecycleScript", () => {
  it("recognises install and publish hooks with or without a pre/post prefix", () => {
    const hooks = [
      "preinstall",
      "install",
      "postinstall",
      "prepare",
      "prepublish",
      "prepublishOnly",
      "prepack",
      "postpack",
      "publish",
      "postpublish",
    ];

    expect(hooks.filter((name) => !isLifecycleScript(name))).toEqual([]);
  });

  it("rejects every other script", () => {
    const scripts = ["build", "test", "test:unit", "check-types", "clean", "examples", "dev", "prebuild"];

    expect(scripts.filter((name) => isLifecycleScript(name))).toEqual([]);
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
    expect(isMapAnnotatedFile("index.d.mts")).toBe(true);
    expect(isMapAnnotatedFile("styles.css")).toBe(false);
    expect(isMapAnnotatedFile("index.js.map")).toBe(false);
  });
});
