import path from "node:path";

import { describe, expect, it } from "vitest";

import { runExportsGenerate } from "#exports/run";
import { createCommandContext } from "#tests/unit/support/command-context";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");
const manifestPath = path.join(root, "packages/kit/package.json");

function project(config?: object): ReturnType<typeof createMemoryFilesystem> {
  return createMemoryFilesystem({
    [path.join(root, "pnpm-workspace.yaml")]: 'packages:\n  - "packages/*"\n',
    [manifestPath]: `${JSON.stringify({ name: "@acme/kit", type: "module" }, null, 2)}\n`,
    [path.join(root, "packages/kit/src/index.ts")]: "export const a = 1;\n",
    [path.join(root, "packages/kit/dist/index.js")]: "export const a = 1;\n",
    [path.join(root, "packages/kit/dist/index.d.ts")]: "export declare const a: number;\n",
    [path.join(root, "packages/raw/package.json")]: '{"name":"@acme/raw"}',
    ...(config === undefined ? {} : { [path.join(root, "codefast.config.json")]: JSON.stringify(config) }),
  });
}

describe("runExportsGenerate", () => {
  it("writes the exports a package's dist/ builds, and skips a package with no dist/", async () => {
    const { fs, read } = project();
    const context = await createCommandContext(fs, { cwd: root, flags: { dryRun: false } });

    const outcome = await runExportsGenerate(context);

    expect(outcome.ok && outcome.value.packages).toEqual([
      expect.objectContaining({
        name: "@acme/kit",
        status: "changed",
        files: ["packages/kit/package.json"],
        exports: { total: 2, modules: 1, stylesheets: 0, custom: 0 },
      }),
      expect.objectContaining({ name: "@acme/raw", status: "skipped", reason: "no dist/ to read — build it first" }),
    ]);
    expect(JSON.parse(read(manifestPath) ?? "")).toMatchObject({
      exports: { ".": { source: "./src/index.ts", types: "./dist/index.d.ts", import: "./dist/index.js" } },
      main: "./dist/index.js",
    });
  });

  it("reports a package already up to date as unchanged, and writes nothing on a dry run", async () => {
    const first = project();
    await runExportsGenerate(await createCommandContext(first.fs, { cwd: root, flags: { dryRun: false } }));
    const second = await runExportsGenerate(
      await createCommandContext(first.fs, { cwd: root, target: "packages/kit", flags: { dryRun: false } }),
    );

    const dry = project();
    const before = dry.read(manifestPath);
    const dryRun = await runExportsGenerate(await createCommandContext(dry.fs, { cwd: root, flags: { dryRun: true } }));

    expect(second.ok && second.value.packages.map(({ status }) => status)).toEqual(["unchanged"]);
    expect(dryRun.ok && dryRun.value.packages[0]?.status).toBe("changed");
    expect(dry.read(manifestPath)).toBe(before);
  });

  it("skips a package the config sets to false, by name or glob", async () => {
    const { fs } = project({ exports: { "@acme/*": false } });

    const outcome = await runExportsGenerate(await createCommandContext(fs, { cwd: root, flags: { dryRun: true } }));

    expect(outcome.ok && outcome.value.packages.map(({ status, reason }) => [status, reason])).toEqual([
      ["skipped", "skipped by the config"],
      ["skipped", "skipped by the config"],
    ]);
  });
});
