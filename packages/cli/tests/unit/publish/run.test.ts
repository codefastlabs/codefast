import path from "node:path";

import { describe, expect, it } from "vitest";

import { runPublishPrepare } from "#publish/run";
import { createCommandContext } from "#tests/unit/support/command-context";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const ROOT = path.resolve("/repo");
const PKG = path.join(ROOT, "packages/di");

function seedPackage(): Record<string, string> {
  return {
    [path.join(ROOT, "pnpm-workspace.yaml")]: 'packages:\n  - "packages/*"\n',
    [`${PKG}/package.json`]: `${JSON.stringify(
      {
        name: "@codefast/di",
        files: ["dist", "src", "README.md"],
        exports: { ".": { source: "./src/index.ts", types: "./dist/index.d.ts", import: "./dist/index.js" } },
        imports: {
          "#tests/*": ["./tests/*"],
          "#*": { source: ["./src/*"], types: "./dist/*.d.ts", default: "./dist/*.js" },
        },
        scripts: { build: "tsc -p tsconfig.build.json", test: "vitest run" },
        devDependencies: { typescript: "^7.0.2" },
      },
      null,
      2,
    )}\n`,
    [`${PKG}/dist/index.js`]: "export const x = 1;\n//# sourceMappingURL=index.js.map\n",
    [`${PKG}/dist/index.js.map`]: "{}",
    [`${PKG}/dist/index.d.ts`]: "export declare const x: number;\n//# sourceMappingURL=index.d.ts.map\n",
    [`${PKG}/dist/index.d.ts.map`]: "{}",
    [`${PKG}/dist/core/token.js`]: "export const t = 1;\n//# sourceMappingURL=token.js.map\n",
    [`${PKG}/dist/core/token.js.map`]: "{}",
  };
}

async function prepare(files: Record<string, string>, flags: { dryRun: boolean; force: boolean }) {
  const memory = createMemoryFilesystem(files);
  const context = await createCommandContext(memory.fs, { cwd: ROOT, target: "packages/di", flags });
  return { ...memory, outcome: await runPublishPrepare(context) };
}

describe("runPublishPrepare", () => {
  it("strips the development lane and dist maps of a published package", async () => {
    const { read, outcome } = await prepare(seedPackage(), { dryRun: false, force: true });

    const manifest = JSON.parse(read(`${PKG}/package.json`) ?? "") as Record<string, unknown>;
    expect(manifest.files).toEqual(["dist", "README.md"]);
    expect(manifest.exports).toEqual({ ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } });
    expect(manifest.imports).toEqual({ "#*": { types: "./dist/*.d.ts", default: "./dist/*.js" } });
    expect(manifest).not.toHaveProperty("scripts");
    expect(manifest).not.toHaveProperty("devDependencies");
    expect(read(`${PKG}/dist/index.js.map`)).toBeUndefined();
    expect(read(`${PKG}/dist/core/token.js.map`)).toBeUndefined();
    expect(read(`${PKG}/dist/index.js`)).not.toContain("sourceMappingURL");

    expect(outcome.ok && outcome.value.packages).toEqual([
      expect.objectContaining({
        name: "@codefast/di",
        directory: "packages/di",
        status: "changed",
        dropped: {
          filesSrc: true,
          exportsSource: 1,
          importsSource: 1,
          importsUnshipped: 1,
          scripts: 2,
          devDependencies: 1,
          sourceMaps: 3,
          sourceMappingComments: 3,
        },
      }),
    ]);
  });

  it("touches nothing on a dry run but still reports what it would drop", async () => {
    const files = seedPackage();
    const { read, outcome } = await prepare(files, { dryRun: true, force: false });

    for (const [filePath, content] of Object.entries(files)) {
      expect(read(filePath)).toBe(content);
    }
    expect(outcome.ok && outcome.value.packages[0]).toMatchObject({ status: "changed", dropped: { sourceMaps: 3 } });
  });

  it("skips a private package", async () => {
    const { outcome } = await prepare(
      {
        [path.join(ROOT, "pnpm-workspace.yaml")]: 'packages:\n  - "packages/*"\n',
        [`${PKG}/package.json`]: JSON.stringify({ name: "@codefast/benchmark-di", private: true }),
      },
      { dryRun: false, force: true },
    );

    expect(outcome.ok && outcome.value.packages[0]).toMatchObject({
      status: "skipped",
      reason: "private, never published",
    });
  });
});
