import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadConfig } from "#core/config/loader";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");

describe("loadConfig", () => {
  it("returns an empty config when the root holds none", async () => {
    const config = await loadConfig(root, createMemoryFilesystem({}).fs);

    expect(config).toEqual({ ok: true, value: {} });
  });

  it("reads and validates a JSON config", async () => {
    const { fs } = createMemoryFilesystem({
      [path.join(root, "codefast.config.json")]: JSON.stringify({
        exports: { "@acme/ui": { strip: "./components/" } },
      }),
    });

    const config = await loadConfig(root, fs);

    expect(config.ok && config.value.exports).toEqual({
      "@acme/ui": { strip: "./components/", source: true, types: true, import: true },
    });
  });

  it("names the file and the key a strict schema refuses", async () => {
    const { fs } = createMemoryFilesystem({ [path.join(root, "codefast.config.json")]: '{"mirror":{}}' });

    const config = await loadConfig(root, fs);

    expect(!config.ok && config.error).toMatchObject({ code: "VALIDATION_ERROR" });
    expect(!config.ok && config.error.message).toMatch(/^codefast\.config\.json: .*mirror/);
  });

  it("refuses two config files at the root rather than ranking them", async () => {
    const { fs } = createMemoryFilesystem({
      [path.join(root, "codefast.config.json")]: "{}",
      [path.join(root, "codefast.config.js")]: "export default {};",
    });

    const config = await loadConfig(root, fs);

    expect(!config.ok && config.error.message).toBe(
      "Several config files at the project root: codefast.config.js, codefast.config.json",
    );
  });

  it("reports a config file that does not parse as INFRA_FAILURE", async () => {
    const { fs } = createMemoryFilesystem({ [path.join(root, "codefast.config.json")]: "{" });

    const config = await loadConfig(root, fs);

    expect(!config.ok && config.error.code).toBe("INFRA_FAILURE");
  });
});
