import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createPathTransform,
  getExportGroup,
  groupFilesByModule,
  normalizePath,
  toExportPath,
} from "./generate-exports.ts";

describe("generate-exports pure functions", () => {
  describe("normalizePath", () => {
    it("converts backslashes to forward slashes", () => {
      assert.strictEqual(normalizePath("src\\components\\index.ts"), "src/components/index.ts");
      assert.strictEqual(normalizePath("windows\\path"), "windows/path");
    });

    it("leaves forward slashes unchanged", () => {
      assert.strictEqual(normalizePath("src/components/index.ts"), "src/components/index.ts");
    });
  });

  describe("toExportPath", () => {
    it("maps root index to '.'", () => {
      assert.strictEqual(toExportPath("index"), ".");
    });

    it("maps nested index to its directory", () => {
      assert.strictEqual(toExportPath("components/index"), "./components");
      assert.strictEqual(toExportPath("ui/button/index"), "./ui/button");
    });

    it("maps normal files to their exact path with prefix (./)", () => {
      assert.strictEqual(toExportPath("utils"), "./utils");
      assert.strictEqual(toExportPath("core/types"), "./core/types");
    });
  });

  describe("createPathTransform", () => {
    it("returns null if config or transformation for package is missing", () => {
      assert.strictEqual(createPathTransform(undefined, "pkg"), null);
      assert.strictEqual(createPathTransform({ pathTransformations: {} }, "pkg"), null);
    });

    it("creates a transform function that removes prefixes", () => {
      const config = {
        pathTransformations: {
          "packages/ui": { removePrefix: "./components/" },
        },
      };
      const transform = createPathTransform(config, "packages/ui");
      assert.ok(transform !== null);

      assert.strictEqual(transform("./components/button"), "./button");
      assert.strictEqual(transform("./components/index"), "./index");
      assert.strictEqual(transform("./components"), "./components"); // does not catch without trailing slash
      // Keeps unmodified paths untouched
      assert.strictEqual(transform("./utils/string"), "./utils/string");
    });
  });

  describe("getExportGroup (sorting algorithm properties)", () => {
    it("assigns special base order to root index '.'", () => {
      assert.deepStrictEqual(getExportGroup(".", null), [".", "", 0, 0]);
    });

    it("detects and groups wildcards (like css/*)", () => {
      assert.deepStrictEqual(getExportGroup("./css/*", null), ["css", "", 900, 0]);
      assert.deepStrictEqual(getExportGroup("./assets/*", null), ["assets", "", 100, 0]);
    });

    it("groups predefined first-level folders correctly", () => {
      // 'components' has predefined weight 100
      assert.deepStrictEqual(getExportGroup("./components/button", null), [
        "components",
        "button",
        100,
        1,
      ]);
      // 'utils' has predefined weight 600
      assert.deepStrictEqual(getExportGroup("./utils/string", null), ["utils", "string", 600, 1]);
    });

    it("applies fallback logic for unknown groups", () => {
      assert.deepStrictEqual(getExportGroup("./unknown", null), ["", "unknown", 800, 1]);
      assert.deepStrictEqual(getExportGroup("./unknown/file", null), ["unknown", "file", 700, 1]);
    });
  });

  describe("groupFilesByModule", () => {
    it("groups matching extensions into module objects", () => {
      const files = [
        "index.js",
        "index.cjs",
        "index.d.ts",
        "utils.js",
        "utils.d.ts",
        "ignored.css",
        "orphaned.js",
      ];
      const modules = groupFilesByModule(files);

      assert.strictEqual(modules.size, 3); // index, utils, orphaned

      const indexMod = modules.get("index");
      assert.ok(indexMod);
      assert.strictEqual(indexMod.files.js, "index.js");
      assert.strictEqual(indexMod.files.cjs, "index.cjs");
      assert.strictEqual(indexMod.files.dts, "index.d.ts");

      const utilsMod = modules.get("utils");
      assert.ok(utilsMod);
      assert.strictEqual(utilsMod.files.js, "utils.js");
      assert.strictEqual(utilsMod.files.cjs, null);
      assert.strictEqual(utilsMod.files.dts, "utils.d.ts");

      const orphanMod = modules.get("orphaned");
      assert.ok(orphanMod);
      assert.strictEqual(orphanMod.files.js, "orphaned.js");
      assert.strictEqual(orphanMod.files.dts, null);
    });

    it("handles nested paths correctly", () => {
      const files = ["core/types.js", "core/types.d.ts"];
      const modules = groupFilesByModule(files);
      assert.ok(modules.has("core/types"));
      assert.strictEqual(modules.get("core/types")?.files.js, "core/types.js");
    });

    it("skips directories or empty basenames implicitly", () => {
      // Ext is ignored for non-js/ts.
      const files = [".js", ".d.ts", "a/b/.js"];
      const modules = groupFilesByModule(files);
      assert.strictEqual(modules.size, 0);
    });
  });
});
