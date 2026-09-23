import { afterEach, describe, expect, it, vi } from "vitest";

import { presentAssertionAuditResult } from "#audit/assertions/output";
import type { AssertionAuditResult } from "#audit/domain/types";
import { logger } from "#core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentAssertionAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each violation and a failing total", () => {
    const result: AssertionAuditResult = {
      files: [{ relativePath: "src/a.ts", violations: [{ line: 4, raw: "x as unknown as T", reason: "double" }] }],
      violationCount: 1,
      allowlistedCount: 0,
      scannedFileCount: 2,
    };

    const out = captureOut(() => {
      presentAssertionAuditResult(result);
    });

    expect(out).toContain("src/a.ts");
    expect(out).toContain("4: x as unknown as T → double");
    expect(out).toContain("✖ 1 type-assertion violation(s)");
  });

  it("prints a clean summary, noting what the allowlist kept", () => {
    const out = captureOut(() => {
      presentAssertionAuditResult({ files: [], violationCount: 0, allowlistedCount: 1, scannedFileCount: 5 });
    });

    expect(out).toContain("✓ No double assertions across 5 file(s) (1 allowlisted)");
  });
});
