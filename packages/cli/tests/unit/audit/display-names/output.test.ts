import { afterEach, describe, expect, it, vi } from "vitest";

import { presentDisplayNameAuditResult } from "#/audit/display-names/output";
import type { DisplayNameAuditResult } from "#/audit/domain/types";
import { logger } from "#/core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentDisplayNameAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each violation and a failing total", () => {
    const result: DisplayNameAuditResult = {
      files: [
        { relativePath: "src/a.ts", violations: [{ line: 7, raw: 'token("Logger")', reason: "missing <namespace>:" }] },
      ],
      violationCount: 1,
      allowlistedCount: 0,
      scannedFileCount: 6,
    };

    const out = captureOut(() => {
      presentDisplayNameAuditResult(result);
    });

    expect(out).toContain("src/a.ts");
    expect(out).toContain("missing <namespace>:");
    expect(out).toContain("✖ 1 display name(s) off the convention");
  });

  it("prints a clean summary when every name follows the convention", () => {
    const out = captureOut(() => {
      presentDisplayNameAuditResult({ files: [], violationCount: 0, allowlistedCount: 0, scannedFileCount: 6 });
    });

    expect(out).toContain("✓ Every token, tag and module display name follows <namespace>:<Name> across 6 file(s)");
  });
});
