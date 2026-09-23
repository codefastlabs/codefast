import { describe, expect, it } from "vitest";

import { exitCodeForAssertionAuditResult, formatAssertionAuditJsonOutput } from "#audit/assertions/cli-result";
import type { AssertionAuditResult } from "#audit/domain/types";

const clean: AssertionAuditResult = { files: [], violationCount: 0, allowlistedCount: 0, scannedFileCount: 3 };
const dirty: AssertionAuditResult = {
  files: [{ relativePath: "a.ts", violations: [{ line: 1, raw: "x as unknown as T", reason: "double assertion" }] }],
  violationCount: 1,
  allowlistedCount: 0,
  scannedFileCount: 3,
};

describe("assertions cli-result", () => {
  it("exits 0 when clean and 1 when violations remain", () => {
    expect(exitCodeForAssertionAuditResult(clean)).toBe(0);
    expect(exitCodeForAssertionAuditResult(dirty)).toBe(1);
  });

  it("serializes a machine summary carrying ok and cwd", () => {
    expect(JSON.parse(formatAssertionAuditJsonOutput(dirty, "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
      result: { violationCount: 1 },
    });
    expect(JSON.parse(formatAssertionAuditJsonOutput(clean, "/repo")).ok).toBe(true);
  });
});
