import { describe, expect, it } from "vitest";

import { exitCodeForDisplayNameAuditResult, formatDisplayNameAuditJsonOutput } from "#/audit/display-names/cli-result";
import type { DisplayNameAuditResult } from "#/audit/domain/types";

const clean: DisplayNameAuditResult = { files: [], violationCount: 0, allowlistedCount: 0, scannedFileCount: 4 };
const dirty: DisplayNameAuditResult = {
  files: [{ relativePath: "a.ts", violations: [{ line: 1, raw: 'token("Logger")', reason: "missing <namespace>:" }] }],
  violationCount: 1,
  allowlistedCount: 0,
  scannedFileCount: 4,
};

describe("display-names cli-result", () => {
  it("exits 0 when clean and 1 when violations remain", () => {
    expect(exitCodeForDisplayNameAuditResult(clean)).toBe(0);
    expect(exitCodeForDisplayNameAuditResult(dirty)).toBe(1);
  });

  it("serializes a machine summary carrying ok and cwd", () => {
    expect(JSON.parse(formatDisplayNameAuditJsonOutput(dirty, "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
      result: { violationCount: 1 },
    });
    expect(JSON.parse(formatDisplayNameAuditJsonOutput(clean, "/repo")).ok).toBe(true);
  });
});
