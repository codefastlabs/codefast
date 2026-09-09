import { describe, expect, it } from "vitest";

import type { RtlAuditResult } from "#/audit/domain/types";
import { exitCodeForRtlAuditResult, formatRtlAuditJsonOutput } from "#/audit/rtl/cli-result";

const clean: RtlAuditResult = { files: [], violationCount: 0, allowlistedCount: 0, scannedFileCount: 2 };
const dirty: RtlAuditResult = {
  files: [{ relativePath: "x.tsx", violations: [{ line: 1, raw: "pl-2", suggestion: "ps-2" }] }],
  violationCount: 1,
  allowlistedCount: 0,
  scannedFileCount: 2,
};

describe("rtl cli-result", () => {
  it("exits 0 when clean and 1 when violations remain", () => {
    expect(exitCodeForRtlAuditResult(clean)).toBe(0);
    expect(exitCodeForRtlAuditResult(dirty)).toBe(1);
  });

  it("serializes a machine summary carrying ok and cwd", () => {
    expect(JSON.parse(formatRtlAuditJsonOutput(dirty, "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
      result: { violationCount: 1 },
    });
    expect(JSON.parse(formatRtlAuditJsonOutput(clean, "/repo")).ok).toBe(true);
  });
});
