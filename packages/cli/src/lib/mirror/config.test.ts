import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createNodeCliFs } from "#lib/infra/node-io";
import { loadMirrorConfig } from "#lib/mirror/config";

describe("loadMirrorConfig", () => {
  const cliFs = createNodeCliFs();

  it("documents that runtime import() failures push a warning and continue with JSON fallback", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-config-js-throw-"));
    try {
      fs.writeFileSync(path.join(root, "codefast.config.js"), 'throw new Error("boom");\n', "utf8");
      fs.writeFileSync(
        path.join(root, "codefast.config.json"),
        JSON.stringify({ skipPackages: ["packages/skip"] }),
        "utf8",
      );

      const { config, warnings } = await loadMirrorConfig(root, cliFs);
      expect(config).toEqual({ skipPackages: ["packages/skip"] });
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("Could not load codefast.config.js");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("documents that invalid JSON pushes a warning and returns an empty config", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-config-invalid-json-"));
    try {
      fs.writeFileSync(path.join(root, "codefast.config.json"), "{ invalid json", "utf8");

      const { config, warnings } = await loadMirrorConfig(root, cliFs);
      expect(config).toEqual({});
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("Could not parse codefast.config.json");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("documents that wrapped mirror config objects are unwrapped before validation", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "mirror-config-wrapped-"));
    try {
      fs.writeFileSync(
        path.join(root, "codefast.config.json"),
        JSON.stringify({
          mirror: {
            skipPackages: ["packages/legacy"],
            customExports: {
              "packages/ui": {
                "./custom": "./dist/custom.js",
              },
            },
          },
        }),
        "utf8",
      );

      const { config, warnings } = await loadMirrorConfig(root, cliFs);
      expect(warnings).toEqual([]);
      expect(config).toEqual({
        skipPackages: ["packages/legacy"],
        customExports: {
          "packages/ui": {
            "./custom": "./dist/custom.js",
          },
        },
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
