import { describe, expect, it } from "vitest";

import { runDisplayNameAudit } from "#audit/display-names/run";
import { createAuditContext } from "#tests/unit/support/audit-context";

describe("runDisplayNameAudit", () => {
  it("scans TypeScript and markdown, and skips tests, benchmarks, changesets and changelogs", async () => {
    const { context } = await createAuditContext({
      "packages/di/src/a.ts": `export const A = token<number>("A");\n`,
      "packages/di/README.md": '```ts\nconst B = token<number>("B");\n```\n',
      "packages/di/tests/unit/a.test.ts": `token<number>("T");\n`,
      "benchmarks/di/src/bench.ts": `token<number>("Bench");\n`,
      ".changeset/note.md": `token<number>("Note");\n`,
      "packages/di/CHANGELOG.md": `token<number>("Old");\n`,
      "packages/di/src/ok.ts": `export const C = token<number>("di:C");\n`,
    });

    const outcome = runDisplayNameAudit(context);

    expect(outcome.ok && outcome.value.scannedFiles).toBe(3);
    expect(outcome.ok && outcome.value.findings.map(({ file }) => file).toSorted()).toEqual([
      "packages/di/README.md",
      "packages/di/src/a.ts",
    ]);
  });
});
