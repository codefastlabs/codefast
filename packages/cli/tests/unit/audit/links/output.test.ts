import { afterEach, describe, expect, it, vi } from "vitest";

import type { LinkAuditResult } from "#/audit/domain/types";
import { presentLinkAuditResult } from "#/audit/links/output";
import { logger } from "#/core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentLinkAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each breakage and a failing total", () => {
    const result: LinkAuditResult = {
      files: [{ relativePath: "docs/a.md", breakages: [{ line: 2, raw: "./gone.md", reason: "path does not exist" }] }],
      breakageCount: 1,
      allowlistedCount: 0,
      linkCount: 3,
      scannedFileCount: 2,
    };

    const out = captureOut(() => {
      presentLinkAuditResult(result);
    });

    expect(out).toContain("docs/a.md");
    expect(out).toContain("2: ./gone.md → path does not exist");
    expect(out).toContain("✖ 1 broken link(s)");
  });

  it("prints a clean summary when every link resolves", () => {
    const out = captureOut(() => {
      presentLinkAuditResult({ files: [], breakageCount: 0, allowlistedCount: 0, linkCount: 5, scannedFileCount: 2 });
    });

    expect(out).toContain("✓ 5 repo-local link(s) across 2 document(s) all resolve");
  });
});
