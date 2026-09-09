import { afterEach, describe, expect, it, vi } from "vitest";

import type { ImportsAuditResult } from "#/audit/domain/types";
import { presentImportsAuditResult } from "#/audit/imports/output";
import { logger } from "#/core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentImportsAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each violation and a failing total", () => {
    const result: ImportsAuditResult = {
      files: [
        {
          relativePath: "src/a.tsx",
          violations: [{ line: 1, raw: 'import * as React from "react"', reason: "React namespace import" }],
        },
      ],
      violationCount: 1,
      allowlistedCount: 0,
      scannedFileCount: 3,
    };

    const out = captureOut(() => {
      presentImportsAuditResult(result);
    });

    expect(out).toContain("src/a.tsx");
    expect(out).toContain("React namespace import");
    expect(out).toContain("✖ 1 import-policy violation(s)");
  });

  it("prints a clean summary when no import breaks the policy", () => {
    const out = captureOut(() => {
      presentImportsAuditResult({ files: [], violationCount: 0, allowlistedCount: 0, scannedFileCount: 3 });
    });

    expect(out).toContain("✓ No import-policy violations across 3 file(s)");
  });
});
