import path from "node:path";

import { describe, expect, it } from "vitest";

import { runSinceStamp } from "#since/run";
import { createCommandContext } from "#tests/unit/support/command-context";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");
const blockedFile = path.join(root, "packages/kit/src/parse.ts");
const stampedFile = path.join(root, "packages/kit/src/format.ts");

const blockedSource = [
  "/**",
  " * Parses a string.",
  " */",
  "export function parse(value: string): number;",
  "// The overload above is what a caller is checked against.",
  "export function parse(value: unknown): number {",
  "  return Number(value);",
  "}",
  "",
].join("\n");

const stampableSource = [
  "/**",
  " * Formats a value.",
  " */",
  "export function format(): string {",
  '  return "";',
  "}",
  "",
].join("\n");

function project(extra: Record<string, string> = {}): ReturnType<typeof createMemoryFilesystem> {
  return createMemoryFilesystem({
    [path.join(root, "pnpm-workspace.yaml")]: 'packages:\n  - "packages/*"\n  - "apps/*"\n',
    [path.join(root, "packages/kit/package.json")]: '{"name":"@acme/kit","version":"1.2.0"}',
    [path.join(root, "packages/kit/tests/unit/format.test.ts")]: "export const t = 1;\n",
    [blockedFile]: blockedSource,
    [stampedFile]: stampableSource,
    ...extra,
  });
}

describe("runSinceStamp", () => {
  it("stamps each package's src with its own version and reports a blocked declaration as a finding", async () => {
    const { fs, read } = project();
    const context = await createCommandContext(fs, { cwd: root, flags: { dryRun: false } });

    const outcome = await runSinceStamp(context);

    expect(outcome.ok && outcome.value).toEqual({
      packages: [
        {
          name: "@acme/kit",
          directory: "packages/kit",
          status: "changed",
          reason: null,
          files: ["packages/kit/src/format.ts"],
          version: "1.2.0",
          filesScanned: 2,
          stampedDeclarations: 1,
        },
      ],
      findings: [
        {
          file: "packages/kit/src/parse.ts",
          line: 6,
          text: "parse",
          message: "no doc block, and a // comment holds the line above it — write the block by hand, then rerun",
        },
      ],
    });
    expect(read(stampedFile)).toContain(" * @since 1.2.0");
    expect(read(blockedFile)).toBe(blockedSource);
    expect(read(path.join(root, "packages/kit/tests/unit/format.test.ts"))).not.toContain("@since");
  });

  it("narrows to the file a target names, and writes nothing on a dry run", async () => {
    const { fs, read } = project();
    const context = await createCommandContext(fs, {
      cwd: root,
      target: "packages/kit/src/format.ts",
      flags: { dryRun: true },
    });

    const outcome = await runSinceStamp(context);

    expect(outcome.ok && outcome.value.packages[0]).toMatchObject({ status: "changed", filesScanned: 1 });
    expect(outcome.ok && outcome.value.findings).toEqual([]);
    expect(read(stampedFile)).toBe(stampableSource);
  });

  it("skips a package the config names and fails one with no version", async () => {
    const { fs } = project({
      [path.join(root, "codefast.config.json")]: JSON.stringify({ since: { "@apps/*": false } }),
      [path.join(root, "apps/web/package.json")]: '{"name":"@apps/web","version":"0.0.0"}',
      [path.join(root, "packages/raw/package.json")]: '{"name":"@acme/raw"}',
    });
    const context = await createCommandContext(fs, { cwd: root, flags: { dryRun: true } });

    const outcome = await runSinceStamp(context);

    expect(outcome.ok && outcome.value.packages.map(({ name, status, reason }) => [name, status, reason])).toEqual([
      ["@apps/web", "skipped", "skipped by the config"],
      ["@acme/kit", "changed", null],
      ["@acme/raw", "failed", "package.json declares no version to stamp"],
    ]);
  });
});
