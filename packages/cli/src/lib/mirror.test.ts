import {
  createPathTransform,
  getExportGroup,
  groupFilesByModule,
  normalizePath,
  toExportPath,
} from "#lib/mirror";

describe("mirror pure functions", () => {
  describe("normalizePath", () => {
    it("converts backslashes to forward slashes", () => {
      expect(normalizePath("src\\components\\index.ts")).toBe("src/components/index.ts");
      expect(normalizePath("windows\\path")).toBe("windows/path");
    });

    it("leaves forward slashes unchanged", () => {
      expect(normalizePath("src/components/index.ts")).toBe("src/components/index.ts");
    });
  });

  describe("toExportPath", () => {
    it("maps root index to '.'", () => {
      expect(toExportPath("index")).toBe(".");
    });

    it("maps nested index to its directory", () => {
      expect(toExportPath("components/index")).toBe("./components");
      expect(toExportPath("ui/button/index")).toBe("./ui/button");
    });

    it("maps normal files to their exact path with prefix (./)", () => {
      expect(toExportPath("utils")).toBe("./utils");
      expect(toExportPath("core/types")).toBe("./core/types");
    });
  });

  describe("createPathTransform", () => {
    it("returns null if config or transformation for package is missing", () => {
      expect(createPathTransform(undefined, { relPath: "pkg", packageName: "pkg" })).toBeNull();
      expect(
        createPathTransform({ pathTransformations: {} }, { relPath: "pkg", packageName: "pkg" }),
      ).toBeNull();
    });

    it("creates a transform function that removes prefixes", () => {
      const config = {
        pathTransformations: {
          "packages/ui": { removePrefix: "./components/" },
        },
      };
      const transform = createPathTransform(config, {
        relPath: "packages/ui",
        packageName: "@acme/ui",
      });
      expect(transform).not.toBeNull();

      expect(transform!("./components/button")).toBe("./button");
      expect(transform!("./components/index")).toBe("./index");
      expect(transform!("./components")).toBe("./components"); // does not catch without trailing slash
      // Keeps unmodified paths untouched
      expect(transform!("./utils/string")).toBe("./utils/string");
    });

    it("prefixes ./ when the stripped path is not already relative", () => {
      const config = {
        pathTransformations: {
          "packages/ui": { removePrefix: "components/" },
        },
      };
      const transform = createPathTransform(config, {
        relPath: "packages/ui",
        packageName: "@acme/ui",
      });
      expect(transform).not.toBeNull();
      expect(transform!("components/button")).toBe("./button");
    });

    it("returns the stripped path unchanged when it is empty or already relative", () => {
      const config = {
        pathTransformations: {
          "packages/ui": { removePrefix: "./entry" },
        },
      };
      const transform = createPathTransform(config, {
        relPath: "packages/ui",
        packageName: "@acme/ui",
      });
      expect(transform).not.toBeNull();
      expect(transform!("./entry")).toBe("");
      expect(transform!("./entry.js")).toBe("./.js");
    });
  });

  describe("getExportGroup (sorting algorithm properties)", () => {
    it("assigns special base order to root index '.'", () => {
      expect(getExportGroup(".", null)).toEqual([".", "", 0, 0]);
    });

    it("detects and groups wildcards (like css/*)", () => {
      expect(getExportGroup("./css/*", null)).toEqual(["css", "", 900, 0]);
      expect(getExportGroup("./assets/*", null)).toEqual(["assets", "", 100, 0]);
    });

    it("groups predefined first-level folders correctly", () => {
      // 'components' has predefined weight 100
      expect(getExportGroup("./components/button", null)).toEqual(["components", "button", 100, 1]);
      // 'utils' has predefined weight 600
      expect(getExportGroup("./utils/string", null)).toEqual(["utils", "string", 600, 1]);
    });

    it("applies fallback logic for unknown groups", () => {
      expect(getExportGroup("./unknown", null)).toEqual(["", "unknown", 800, 1]);
      expect(getExportGroup("./unknown/file", null)).toEqual(["unknown", "file", 700, 1]);
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

      expect(modules.size).toBe(3); // index, utils, orphaned

      const indexMod = modules.get("index");
      expect(indexMod).toBeDefined();
      expect(indexMod!.files.js).toBe("index.js");
      expect(indexMod!.files.cjs).toBe("index.cjs");
      expect(indexMod!.files.dts).toBe("index.d.ts");

      const utilsMod = modules.get("utils");
      expect(utilsMod).toBeDefined();
      expect(utilsMod!.files.js).toBe("utils.js");
      expect(utilsMod!.files.cjs).toBeNull();
      expect(utilsMod!.files.dts).toBe("utils.d.ts");

      const orphanMod = modules.get("orphaned");
      expect(orphanMod).toBeDefined();
      expect(orphanMod!.files.js).toBe("orphaned.js");
      expect(orphanMod!.files.dts).toBeNull();
    });

    it("handles nested paths correctly", () => {
      const files = ["core/types.js", "core/types.d.ts"];
      const modules = groupFilesByModule(files);
      expect(modules.has("core/types")).toBe(true);
      expect(modules.get("core/types")?.files.js).toBe("core/types.js");
    });

    it("skips directories or empty basenames implicitly", () => {
      // Ext is ignored for non-js/ts.
      const files = [".js", ".d.ts", "a/b/.js"];
      const modules = groupFilesByModule(files);
      expect(modules.size).toBe(0);
    });
  });
});
