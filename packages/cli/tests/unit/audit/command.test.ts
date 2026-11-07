import { describe, expect, it } from "vitest";

import { auditExitCode, formatAuditJson } from "#audit/command";

describe("audit reporting", () => {
  it("exits 0 when clean and 1 while findings remain", () => {
    expect(auditExitCode(true)).toBe(0);
    expect(auditExitCode(false)).toBe(1);
  });

  it("serializes one machine summary carrying ok, cwd and the result", () => {
    expect(JSON.parse(formatAuditJson({ violationCount: 2 }, "/repo", false))).toEqual({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
      result: { violationCount: 2 },
    });
  });
});
