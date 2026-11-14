import { describe, expect, it } from "vitest";

import { runRtlAudit } from "#audit/rtl/run";
import { createAuditContext } from "#tests/unit/support/audit-context";

describe("runRtlAudit", () => {
  it("reports each physical class at its root-relative file and line", async () => {
    const { context } = await createAuditContext(
      { "packages/ui/src/sheet.ts": `const c = "ml-2 slide-in-from-left-2";` },
      { target: "packages/ui/src" },
    );

    const outcome = runRtlAudit(context);

    expect(outcome.ok && outcome.value).toMatchObject({
      scannedFiles: 1,
      findings: [
        { file: "packages/ui/src/sheet.ts", line: 1, text: "ml-2", message: "use ms-2" },
        { file: "packages/ui/src/sheet.ts", line: 1, text: "slide-in-from-left-2" },
      ],
    });
  });
});
