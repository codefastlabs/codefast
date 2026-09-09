import { describe, expect, it } from "vitest";

import type { ImportsAuditResult } from "#/audit/domain/types";
import { exitCodeForImportsAuditResult, formatImportsAuditJsonOutput } from "#/audit/imports/cli-result";

const clean: ImportsAuditResult = { files: [], violationCount: 0, allowlistedCount: 0, scannedFileCount: 3 };
const dirty: ImportsAuditResult = {
  files: [
    { relativePath: "a.tsx", violations: [{ line: 1, raw: "import * as React", reason: "React namespace import" }] },
  ],
  violationCount: 1,
  allowlistedCount: 0,
  scannedFileCount: 3,
};

describe("imports cli-result", () => {
  it("exits 0 when clean and 1 when violations remain", () => {
    expect(exitCodeForImportsAuditResult(clean)).toBe(0);
    expect(exitCodeForImportsAuditResult(dirty)).toBe(1);
  });

  it("serializes a machine summary carrying ok and cwd", () => {
    expect(JSON.parse(formatImportsAuditJsonOutput(dirty, "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
    });
    expect(JSON.parse(formatImportsAuditJsonOutput(clean, "/repo")).ok).toBe(true);
  });
});
