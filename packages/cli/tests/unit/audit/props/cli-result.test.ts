import { describe, expect, it } from "vitest";

import type { PropsAuditResult } from "#audit/domain/types";
import { exitCodeForPropsAuditResult, formatPropsAuditJsonOutput } from "#audit/props/cli-result";

const clean: PropsAuditResult = { files: [], violationCount: 0, allowlistedCount: 0, scannedFileCount: 3 };
const dirty: PropsAuditResult = {
  files: [{ relativePath: "a.tsx", violations: [{ line: 1, raw: "type AProps = A & B;", reason: "joins" }] }],
  violationCount: 1,
  allowlistedCount: 0,
  scannedFileCount: 3,
};

describe("props cli-result", () => {
  it("exits 0 when clean and 1 when violations remain", () => {
    expect(exitCodeForPropsAuditResult(clean)).toBe(0);
    expect(exitCodeForPropsAuditResult(dirty)).toBe(1);
  });

  it("serializes a machine summary carrying ok and cwd", () => {
    expect(JSON.parse(formatPropsAuditJsonOutput(dirty, "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
      result: { violationCount: 1 },
    });
    expect(JSON.parse(formatPropsAuditJsonOutput(clean, "/repo")).ok).toBe(true);
  });
});
