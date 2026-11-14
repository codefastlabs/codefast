import path from "node:path";

import { describe, expect, it } from "vitest";

import { runSinceVersionsAudit } from "#audit/since-versions/run";
import { createCommandContext } from "#tests/unit/support/command-context";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

const root = path.resolve("/repo");

const stamped = (version: string): string =>
  `/**\n * Does a thing.\n *\n * @since ${version}\n */\nexport const a = 1;\n`;

function project(): ReturnType<typeof createMemoryFilesystem> {
  return createMemoryFilesystem({
    [path.join(root, "package.json")]: '{"name":"repo","private":true}',
    [path.join(root, "pnpm-workspace.yaml")]: 'packages:\n  - "packages/*"\n',
    [path.join(root, "packages/kit/package.json")]: '{"name":"@acme/kit","version":"0.7.0"}',
    [path.join(root, "packages/kit/src/released.ts")]: stamped("0.7.0"),
    [path.join(root, "packages/kit/src/upcoming.ts")]: stamped("0.8.0"),
    [path.join(root, "packages/kit/src/theme.css")]: "/*\n * @since 0.9.0\n */\n",
    [path.join(root, "packages/kit/.gitignore")]: "# @since 9.9.9\n",
    [path.join(root, "packages/next/package.json")]: '{"name":"@acme/next","version":"1.0.0"}',
    [path.join(root, "packages/next/src/index.ts")]: stamped("0.8.0"),
    [path.join(root, "packages/draft/package.json")]: '{"name":"@acme/draft"}',
    [path.join(root, "packages/draft/src/index.ts")]: stamped("9.9.9"),
    [path.join(root, "scripts/task.ts")]: stamped("9.9.9"),
  });
}

describe("runSinceVersionsAudit", () => {
  it("judges each file against the version its own package declares", async () => {
    const { fs } = project();

    const outcome = runSinceVersionsAudit(await createCommandContext(fs, { cwd: root, flags: { fix: false } }));

    expect(outcome.ok && outcome.value).toEqual({
      findings: [
        expect.objectContaining({ file: "packages/kit/src/upcoming.ts", line: 4, text: "@since 0.8.0" }),
        expect.objectContaining({ file: "packages/kit/src/theme.css", line: 2, text: "@since 0.9.0" }),
      ],
      scannedFiles: 4,
      scannedPackages: 2,
      fixedFiles: [],
    });
  });

  it("scans only what the target reaches", async () => {
    const { fs } = project();

    const outcome = runSinceVersionsAudit(
      await createCommandContext(fs, { cwd: root, target: "packages/kit/src/released.ts", flags: { fix: false } }),
    );

    expect(outcome.ok && outcome.value).toMatchObject({ findings: [], scannedFiles: 1, scannedPackages: 1 });
  });
});
