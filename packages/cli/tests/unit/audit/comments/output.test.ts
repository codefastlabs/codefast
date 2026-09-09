import { afterEach, describe, expect, it, vi } from "vitest";

import { presentCommentAuditResult } from "#/audit/comments/output";
import type { CommentAuditResult } from "#/audit/domain/types";
import { logger } from "#/core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentCommentAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each breakage, the fixed count, and a failing total", () => {
    const result: CommentAuditResult = {
      files: [
        {
          relativePath: "src/a.ts",
          breakages: [{ line: 4, raw: "// ==== Title ====", reason: "not the one allowed form" }],
        },
      ],
      breakageCount: 1,
      allowlistedCount: 0,
      fixedCount: 2,
      dividerCount: 9,
      scannedFileCount: 5,
    };

    const out = captureOut(() => {
      presentCommentAuditResult(result);
    });

    expect(out).toContain("src/a.ts");
    expect(out).toContain("not the one allowed form");
    expect(out).toContain("✎ Rewrote 2 divider(s)");
    expect(out).toContain("✖ 1 comment issue(s)");
  });

  it("prints a clean summary when every divider matches", () => {
    const out = captureOut(() => {
      presentCommentAuditResult({
        files: [],
        breakageCount: 0,
        allowlistedCount: 0,
        fixedCount: 0,
        dividerCount: 9,
        scannedFileCount: 5,
      });
    });

    expect(out).toContain("✓ 9 divider(s) across 5 file(s), no banned comment content");
  });
});
