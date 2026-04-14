import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createNodeCliFs } from "#lib/infra/node-io";
import { loadConfig, resetConfigLoaderCacheForTests } from "#lib/config/loader";

describe("loadConfig", () => {
  const cliFs = createNodeCliFs();

  async function withCwd<T>(cwd: string, fn: () => Promise<T>): Promise<T> {
    const prev = process.cwd();
    process.chdir(cwd);
    resetConfigLoaderCacheForTests();
    try {
      return await fn();
    } finally {
      process.chdir(prev);
      resetConfigLoaderCacheForTests();
    }
  }

  it("loads mirror + lifecycle hooks from codefast.config.cjs", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "codefast-config-hooks-"));
    try {
      fs.writeFileSync(
        path.join(root, "codefast.config.cjs"),
        [
          "module.exports = {",
          '  mirror: { skipPackages: ["packages/private"] },',
          "  tag: { onAfterWrite: async ({ files }) => {",
          "    if (files.length === 0) return;",
          "  } },",
          "  arrange: { onAfterWrite: ({ files }) => files.length },",
          "};",
          "",
        ].join("\n"),
        "utf8",
      );

      await withCwd(root, async () => {
        const { config, warnings } = await loadConfig(cliFs);
        expect(warnings).toEqual([]);
        expect(config.mirror).toEqual({ skipPackages: ["packages/private"] });
        expect(typeof config.tag?.onAfterWrite).toBe("function");
        expect(typeof config.arrange?.onAfterWrite).toBe("function");
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("requires mirror config to be nested under the mirror key", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "codefast-config-mirror-top-"));
    try {
      fs.writeFileSync(
        path.join(root, "codefast.config.json"),
        JSON.stringify({ skipPackages: ["packages/legacy"] }),
        "utf8",
      );

      await withCwd(root, async () => {
        await expect(loadConfig(cliFs)).rejects.toThrow("Invalid config schema");
        await expect(loadConfig(cliFs)).rejects.toThrow('Unrecognized key: "skipPackages"');
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("throws schema validation errors for invalid hook values", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "codefast-config-invalid-hook-"));
    try {
      fs.writeFileSync(
        path.join(root, "codefast.config.json"),
        JSON.stringify({
          tag: { onAfterWrite: "not-a-function" },
          arrange: { onAfterWrite: 123 },
        }),
        "utf8",
      );

      await withCwd(root, async () => {
        await expect(loadConfig(cliFs)).rejects.toThrow("Invalid config schema");
        await expect(loadConfig(cliFs)).rejects.toThrow("tag.onAfterWrite");
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("resolves config with upward search from process.cwd()", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "codefast-config-upward-"));
    const nested = path.join(root, "packages", "ui", "src");
    try {
      fs.mkdirSync(nested, { recursive: true });
      fs.writeFileSync(
        path.join(root, "codefast.config.json"),
        JSON.stringify({ mirror: { skipPackages: ["packages/infra"] } }),
        "utf8",
      );

      await withCwd(nested, async () => {
        const { config } = await loadConfig(cliFs);
        expect(config.mirror).toEqual({ skipPackages: ["packages/infra"] });
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it("uses singleton cache within one process", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "codefast-config-cache-"));
    try {
      fs.writeFileSync(
        path.join(root, "codefast.config.json"),
        JSON.stringify({ mirror: { skipPackages: ["packages/one"] } }),
        "utf8",
      );

      await withCwd(root, async () => {
        const first = await loadConfig(cliFs);
        fs.writeFileSync(
          path.join(root, "codefast.config.json"),
          JSON.stringify({ mirror: { skipPackages: ["packages/two"] } }),
          "utf8",
        );
        const second = await loadConfig(cliFs);
        expect(second.config.mirror).toEqual(first.config.mirror);
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
