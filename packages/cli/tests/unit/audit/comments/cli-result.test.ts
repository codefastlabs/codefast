import { describe, expect, it } from "vitest";

import { exitCodeForCommentAuditResult, formatCommentAuditJsonOutput } from "#/audit/comments/cli-result";
import type { CommentAuditResult } from "#/audit/domain/types";

const clean: CommentAuditResult = {
  files: [],
  breakageCount: 0,
  allowlistedCount: 0,
  fixedCount: 0,
  dividerCount: 3,
  scannedFileCount: 2,
};
const dirty: CommentAuditResult = {
  files: [
    { relativePath: "a.ts", breakages: [{ line: 1, raw: "// ==== x ====", reason: "not the one allowed form" }] },
  ],
  breakageCount: 1,
  allowlistedCount: 0,
  fixedCount: 0,
  dividerCount: 3,
  scannedFileCount: 2,
};

describe("comments cli-result", () => {
  it("exits 0 when clean and 1 when breakages remain", () => {
    expect(exitCodeForCommentAuditResult(clean)).toBe(0);
    expect(exitCodeForCommentAuditResult(dirty)).toBe(1);
  });

  it("serializes a machine summary carrying ok and cwd", () => {
    expect(JSON.parse(formatCommentAuditJsonOutput(dirty, "/repo"))).toMatchObject({
      schemaVersion: 1,
      ok: false,
      cwd: "/repo",
    });
    expect(JSON.parse(formatCommentAuditJsonOutput(clean, "/repo")).ok).toBe(true);
  });
});
