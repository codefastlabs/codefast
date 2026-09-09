import { afterEach, describe, expect, it, vi } from "vitest";

import type { RtlAuditResult } from "#/audit/domain/types";
import { presentRtlAuditResult } from "#/audit/rtl/output";
import { logger } from "#/core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentRtlAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each violation and a failing total with the allowlist suffix", () => {
    const result: RtlAuditResult = {
      files: [{ relativePath: "a/b.tsx", violations: [{ line: 3, raw: "ml-2", suggestion: "ms-2" }] }],
      violationCount: 1,
      allowlistedCount: 1,
      scannedFileCount: 4,
    };

    const out = captureOut(() => {
      presentRtlAuditResult(result);
    });

    expect(out).toContain("a/b.tsx");
    expect(out).toContain("3: ml-2 → ms-2");
    expect(out).toContain("✖ 1 RTL violation(s) (1 allowlisted)");
  });

  it("prints a clean summary when nothing is flagged", () => {
    const out = captureOut(() => {
      presentRtlAuditResult({ files: [], violationCount: 0, allowlistedCount: 0, scannedFileCount: 4 });
    });

    expect(out).toContain("✓ No physical-direction classes outside the allowlist");
  });
});
