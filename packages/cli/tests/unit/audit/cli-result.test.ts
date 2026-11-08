import { describe, expect, it } from "vitest";

import { auditAllExitCode, auditExitCode, formatAuditAllJson, formatAuditJson } from "#audit/cli-result";
import { AppError } from "#core/errors";

describe("audit reporting", () => {
  it("exits 0 when clean and 1 while findings remain", () => {
    expect(auditExitCode(true)).toBe(0);
    expect(auditExitCode(false)).toBe(1);
  });

  it("serializes one machine summary carrying ok, rootDir and the result", () => {
    expect(JSON.parse(formatAuditJson({ violationCount: 2 }, "/repo", false))).toEqual({
      schemaVersion: 2,
      ok: false,
      rootDir: "/repo",
      result: { violationCount: 2 },
    });
  });

  it("ranks a full run's exit code: an audit that could not run over one with findings", () => {
    expect(auditAllExitCode([{ status: "clean" }, { status: "clean" }])).toBe(0);
    expect(auditAllExitCode([{ status: "clean" }, { status: "findings" }])).toBe(1);
    expect(auditAllExitCode([{ status: "findings" }, { status: "error" }])).toBe(2);
  });

  it("serializes a full run with each audit's result or error", () => {
    const json = formatAuditAllJson(
      [
        { name: "links", status: "findings", result: { breakageCount: 1 }, present: () => {} },
        { name: "rtl", status: "error", error: new AppError("NOT_FOUND", "Not found: /repo/src") },
      ],
      "/repo",
    );

    expect(JSON.parse(json)).toEqual({
      schemaVersion: 2,
      ok: false,
      rootDir: "/repo",
      audits: [
        { name: "links", status: "findings", result: { breakageCount: 1 } },
        { name: "rtl", status: "error", error: { code: "NOT_FOUND", message: "Not found: /repo/src" } },
      ],
    });
  });
});
