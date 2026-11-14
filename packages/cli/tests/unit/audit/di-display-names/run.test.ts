import { describe, expect, it } from "vitest";

import { runDisplayNameAudit } from "#audit/di-display-names/run";
import { createAuditContext } from "#tests/unit/support/audit-context";

const usesDi = 'import { token } from "@codefast/di";\n';

describe("runDisplayNameAudit", () => {
  it("scans the code and markdown that use @codefast/di, and skips tests, benchmarks, changesets and changelogs", async () => {
    const { context } = await createAuditContext({
      "packages/app/src/a.ts": `${usesDi}export const A = token<number>("A");\n`,
      "packages/app/README.md": 'Wire it with `@codefast/di`:\n\n```ts\nconst B = token<number>("B");\n```\n',
      "packages/app/tests/unit/a.test.ts": `${usesDi}token<number>("T");\n`,
      "benchmarks/di/src/bench.ts": `${usesDi}token<number>("Bench");\n`,
      ".changeset/note.md": `@codefast/di token<number>("Note");\n`,
      "packages/app/CHANGELOG.md": `@codefast/di token<number>("Old");\n`,
      "packages/app/src/ok.ts": `${usesDi}export const C = token<number>("app:C");\n`,
    });

    const outcome = runDisplayNameAudit(context);

    expect(outcome.ok && outcome.value.scannedFiles).toBe(3);
    expect(outcome.ok && outcome.value.findings.map(({ file }) => file).toSorted()).toEqual([
      "packages/app/README.md",
      "packages/app/src/a.ts",
    ]);
  });

  it("never reads another library's token() for a display name", async () => {
    const { context } = await createAuditContext({
      "src/auth.ts": 'import { token } from "./auth-token";\nexport const session = token("session");\n',
      "src/testing.ts": 'import { TestBed } from "@codefast/di-testing";\nexport const t = token("x");\n',
      "docs/auth.md": 'Call `token("session")` to mint one.\n',
    });

    const outcome = runDisplayNameAudit(context);

    expect(outcome.ok && outcome.value).toMatchObject({ findings: [], scannedFiles: 0 });
  });
});
