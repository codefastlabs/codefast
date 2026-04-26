import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";
import { NodeCliFsAdapter } from "#/lib/infra/node-io.adapter";
import {
  ConfigLoaderAdapterImpl,
  resetConfigLoaderCacheForTests,
} from "#/lib/config/infra/config-loader.adapter";

describe("ConfigLoaderAdapterImpl", () => {
  const cliFs = new NodeCliFsAdapter();

  const createLoader = (): ConfigLoaderAdapterImpl => new ConfigLoaderAdapterImpl(cliFs);

  async function withCwd<T>(cwd: string, fn: () => Promise<T>): Promise<T> {
    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(cwd);
    resetConfigLoaderCacheForTests();
    try {
      return await fn();
    } finally {
      cwdSpy.mockRestore();
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
          '  mirror: { skipPackages: ["@acme/private"] },',
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
        const { config, warnings } = await createLoader().loadConfig(process.cwd());
        expect(warnings).toEqual([]);
        expect(config.mirror).toEqual({ skipPackages: ["@acme/private"] });
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
        JSON.stringify({ skipPackages: ["@acme/legacy"] }),
        "utf8",
      );

      await withCwd(root, async () => {
        const loader = createLoader();
        await expect(loader.loadConfig(process.cwd())).rejects.toThrow("Invalid config schema");
        await expect(loader.loadConfig(process.cwd())).rejects.toThrow(
          'Unrecognized key: "skipPackages"',
        );
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
        const loader = createLoader();
        await expect(loader.loadConfig(process.cwd())).rejects.toThrow("Invalid config schema");
        await expect(loader.loadConfig(process.cwd())).rejects.toThrow("tag.onAfterWrite");
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
        JSON.stringify({ mirror: { skipPackages: ["@acme/infra"] } }),
        "utf8",
      );

      await withCwd(nested, async () => {
        const { config } = await createLoader().loadConfig(process.cwd());
        expect(config.mirror).toEqual({ skipPackages: ["@acme/infra"] });
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
        JSON.stringify({ mirror: { skipPackages: ["@acme/one"] } }),
        "utf8",
      );

      await withCwd(root, async () => {
        const loader = createLoader();
        const first = await loader.loadConfig(process.cwd());
        fs.writeFileSync(
          path.join(root, "codefast.config.json"),
          JSON.stringify({ mirror: { skipPackages: ["@acme/two"] } }),
          "utf8",
        );
        const second = await loader.loadConfig(process.cwd());
        expect(second.config.mirror).toEqual(first.config.mirror);
      });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
