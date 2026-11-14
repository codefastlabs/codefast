import { describe, expect, it } from "vitest";

import { runAssertionAudit } from "#audit/assertions/run";
import { createAuditContext } from "#tests/unit/support/audit-context";

describe("runAssertionAudit", () => {
  it("scans tests as well as source, and counts what it scanned", async () => {
    const { context } = await createAuditContext({
      "packages/a/src/a.ts": "export const a = value as unknown as Target;\n",
      "packages/a/tests/unit/a.test.ts": "const fake = {} as unknown as Service;\n",
    });

    const outcome = runAssertionAudit(context);

    expect(outcome.ok && outcome.value.scannedFiles).toBe(2);
    expect(outcome.ok && outcome.value.findings.map(({ file }) => file).toSorted()).toEqual([
      "packages/a/src/a.ts",
      "packages/a/tests/unit/a.test.ts",
    ]);
  });
});
