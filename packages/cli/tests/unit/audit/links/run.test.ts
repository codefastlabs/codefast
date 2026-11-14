import { describe, expect, it } from "vitest";

import { runLinkAudit } from "#audit/links/run";
import { createAuditContext } from "#tests/unit/support/audit-context";

describe("runLinkAudit", () => {
  it("passes a path that exists, an anchor its target offers, and an external link it does not check", async () => {
    const { context } = await createAuditContext(
      {
        "docs/guide.md": [
          "# Guide",
          "[spec](../SPEC.md#chain-order)",
          "[self](#guide)",
          "[out](https://example.com/#nope)",
        ].join("\n"),
        "SPEC.md": '<a id="chain-order"></a>\n\n### 2.4 Chain',
      },
      { target: "docs" },
    );

    const outcome = runLinkAudit(context);

    expect(outcome.ok && outcome.value).toMatchObject({ findings: [], scannedFiles: 1 });
  });

  it("reports a missing path, a dangling own anchor, and a dangling cross-document anchor", async () => {
    const { context } = await createAuditContext(
      {
        "docs/guide.md": [
          "# Guide",
          "[gone](./missing.md)",
          "[nowhere](#not-a-heading)",
          "[stale](../SPEC.md#removed)",
        ].join("\n"),
        "SPEC.md": "# Spec",
      },
      { target: "docs" },
    );

    const outcome = runLinkAudit(context);

    expect(outcome.ok && outcome.value.findings).toEqual([
      { file: "docs/guide.md", line: 2, text: "./missing.md", message: "path does not exist" },
      { file: "docs/guide.md", line: 3, text: "#not-a-heading", message: "anchor not found in this document" },
      { file: "docs/guide.md", line: 4, text: "../SPEC.md#removed", message: "anchor not found in SPEC.md" },
    ]);
  });
});
