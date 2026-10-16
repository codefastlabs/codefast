import { afterEach, describe, expect, it, vi } from "vitest";

import type { PropsAuditResult } from "#audit/domain/types";
import { presentPropsAuditResult } from "#audit/props/output";
import { logger } from "#core/logger";

function captureOut(run: () => void): string {
  const spy = vi.spyOn(logger, "out").mockImplementation(() => {});
  run();
  return spy.mock.calls.map((call) => String(call[0])).join("\n");
}

describe("presentPropsAuditResult", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints each violation and a failing total", () => {
    const result: PropsAuditResult = {
      files: [{ relativePath: "src/a.tsx", violations: [{ line: 4, raw: "type AProps = A & B;", reason: "joins" }] }],
      violationCount: 1,
      allowlistedCount: 0,
      scannedFileCount: 2,
    };

    const out = captureOut(() => {
      presentPropsAuditResult(result);
    });

    expect(out).toContain("src/a.tsx");
    expect(out).toContain("4: type AProps = A & B; → joins");
    expect(out).toContain("✖ 1 props-declaration violation(s)");
  });

  it("prints a clean summary, noting what the allowlist kept", () => {
    const out = captureOut(() => {
      presentPropsAuditResult({ files: [], violationCount: 0, allowlistedCount: 1, scannedFileCount: 5 });
    });

    expect(out).toContain("across 5 file(s) (1 allowlisted)");
  });
});
