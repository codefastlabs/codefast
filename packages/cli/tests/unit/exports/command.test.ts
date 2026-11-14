import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCommand } from "#core/command";
import { refuseColor } from "#core/style";
import { exportsGenerateCommand } from "#exports/command";
import { captureLogger } from "#tests/unit/support/logger-capture";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");
const manifestPath = path.join(root, "packages/kit/package.json");

function project(): ReturnType<typeof createMemoryFilesystem> {
  return createMemoryFilesystem({
    [path.join(root, "pnpm-workspace.yaml")]: 'packages:\n  - "packages/*"\n',
    [manifestPath]: `${JSON.stringify({ name: "@acme/kit", type: "module" }, null, 2)}\n`,
    [path.join(root, "packages/kit/src/index.ts")]: "export const a = 1;\n",
    [path.join(root, "packages/kit/dist/index.js")]: "export const a = 1;\n",
    [path.join(root, "packages/kit/dist/index.d.ts")]: "export declare const a: number;\n",
  });
}

async function run(
  memory: ReturnType<typeof createMemoryFilesystem>,
  args: Array<string>,
): Promise<{ exitCode: typeof process.exitCode; out: string }> {
  process.exitCode = undefined;
  const printed = captureLogger();
  await createCommand(exportsGenerateCommand, memory.fs).parseAsync(args, { from: "user" });
  return { exitCode: process.exitCode, out: printed.out() };
}

let previousExitCode: typeof process.exitCode;

beforeEach(() => {
  previousExitCode = process.exitCode;
  refuseColor(true);
  vi.spyOn(process, "cwd").mockReturnValue(root);
});

afterEach(() => {
  process.exitCode = previousExitCode;
  refuseColor(false);
  vi.restoreAllMocks();
});

describe("exports:generate --check", () => {
  it("fails on a package whose exports would change, writing nothing", async () => {
    const memory = project();
    const before = memory.read(manifestPath);

    const { exitCode, out } = await run(memory, ["--check"]);

    expect(exitCode).toBe(1);
    expect(out).toContain("✗ exports:generate: 1 changed — stale; run exports:generate to write them");
    expect(memory.read(manifestPath)).toBe(before);
  });

  it("passes once the exports are written, and a dry run passes either way", async () => {
    const memory = project();

    expect((await run(memory, ["--dry-run"])).exitCode).toBe(0);
    expect((await run(memory, [])).exitCode).toBe(0);
    const { exitCode, out } = await run(memory, ["--check", "--json"]);

    expect(exitCode).toBe(0);
    // The capture spans the test's runs; the JSON document is the last line printed.
    expect(JSON.parse(out.split("\n").at(-1) ?? "")).toMatchObject({
      ok: true,
      result: { packages: [{ status: "unchanged" }] },
    });
  });
});
