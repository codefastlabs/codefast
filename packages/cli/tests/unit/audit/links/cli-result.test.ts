import { describe, expect, it } from "vitest";

import type { LinkAuditResult } from "#/audit/domain/types";
import { exitCodeForLinkAuditResult, formatLinkAuditJsonOutput } from "#/audit/links/cli-result";

const clean: LinkAuditResult = { files: [], breakageCount: 0, allowlistedCount: 0, linkCount: 4, scannedFileCount: 2 };
const dirty: LinkAuditResult = {
  files: [{ relativePath: "a.md", breakages: [{ line: 1, raw: "./gone.md", reason: "path does not exist" }] }],
  breakageCount: 1,
  allowlistedCount: 0,
  linkCount: 4,
  scannedFileCount: 2,
};

describe("links cli-result", () => {
  it("exits 0 when clean and 1 when breakages remain", () => {
    expect(exitCodeForLinkAuditResult(clean)).toBe(0);
    expect(exitCodeForLinkAuditResult(dirty)).toBe(1);
  });

  it("serializes a machine summary carrying ok and cwd", () => {
    expect(JSON.parse(formatLinkAuditJsonOutput(dirty, "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
      result: { breakageCount: 1 },
    });
    expect(JSON.parse(formatLinkAuditJsonOutput(clean, "/repo")).ok).toBe(true);
  });
});
