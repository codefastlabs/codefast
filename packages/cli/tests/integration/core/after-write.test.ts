import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CommandSpec } from "#core/command";
import { createCommand } from "#core/command";
import { logger } from "#core/logger";
import { ok } from "#core/result";

let projectDir: string;
let previousExitCode: typeof process.exitCode;

beforeEach(() => {
  projectDir = realpathSync(mkdtempSync(path.join(tmpdir(), "codefast-after-write-")));
  writeFileSync(path.join(projectDir, "package.json"), '{"name":"solo"}');
  previousExitCode = process.exitCode;
  process.exitCode = undefined;
  vi.spyOn(process, "cwd").mockReturnValue(projectDir);
});

afterEach(() => {
  process.exitCode = previousExitCode;
  vi.restoreAllMocks();
  rmSync(projectDir, { recursive: true, force: true });
});

const writing: CommandSpec<{ readonly wrote: boolean }, "dryRun"> = {
  name: "demo:write",
  description: "Pretend to write a file",
  targetHelp: "anything",
  flags: { dryRun: "Write nothing" },
  run: async () => ok({ wrote: true }),
  verdict: () => "pass",
  present: () => {},
  writtenFiles: (_report, context) => (context.flags.dryRun ? [] : [path.join(context.workspace.rootDir, "a.ts")]),
};

async function runWith(hookBody: string, args: Array<string> = []): Promise<{ exitCode: unknown; err: string }> {
  writeFileSync(
    path.join(projectDir, "codefast.config.mjs"),
    `import { writeFileSync } from "node:fs";\nexport default { afterWrite: ({ command, files }) => { ${hookBody} } };\n`,
  );
  const err = vi.spyOn(logger, "err").mockImplementation(() => {});
  vi.spyOn(logger, "out").mockImplementation(() => {});
  await createCommand(writing).parseAsync(args, { from: "user" });
  return { exitCode: process.exitCode, err: err.mock.calls.map(([line]) => line).join("\n") };
}

describe("the afterWrite hook", () => {
  it("receives the command and the absolute files it wrote", async () => {
    const record = path.join(projectDir, "hook.json");

    const { exitCode } = await runWith(`writeFileSync(${JSON.stringify(record)}, JSON.stringify({ command, files }));`);

    expect(exitCode).toBe(0);
    expect(JSON.parse(readFileSync(record, "utf8"))).toEqual({
      command: "demo:write",
      files: [path.join(projectDir, "a.ts")],
    });
  });

  it("does not run on a dry run", async () => {
    const { exitCode } = await runWith('throw new Error("must not run");', ["--dry-run"]);

    expect(exitCode).toBe(0);
  });

  it("fails the run with exit 1 when it throws", async () => {
    const { exitCode, err } = await runWith('throw new Error("formatter missing");');

    expect(exitCode).toBe(1);
    expect(err).toContain("The afterWrite hook failed: formatter missing");
  });
});
