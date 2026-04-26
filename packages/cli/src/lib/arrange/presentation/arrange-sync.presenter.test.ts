import { describe, expect, it } from "vitest";
import type { ArrangeRunResult } from "#/lib/arrange/domain/types.domain";
import {
  formatArrangeGroupJsonOutput,
  formatArrangeSyncJsonOutput,
} from "#/lib/arrange/presentation/arrange-sync.presenter";

describe("formatArrangeSyncJsonOutput", () => {
  it("sets ok from hookError", () => {
    const result: ArrangeRunResult = {
      filePaths: [],
      modifiedFiles: [],
      totalFound: 0,
      totalChanged: 0,
      hookError: null,
      previewPlans: [],
    };
    const okParsed = JSON.parse(formatArrangeSyncJsonOutput(result, false)) as { ok: boolean };
    expect(okParsed.ok).toBe(true);
    const errParsed = JSON.parse(
      formatArrangeSyncJsonOutput({ ...result, hookError: "e" }, true),
    ) as { ok: boolean };
    expect(errParsed.ok).toBe(false);
  });
});

describe("formatArrangeGroupJsonOutput", () => {
  it("wraps lines", () => {
    const parsed = JSON.parse(
      formatArrangeGroupJsonOutput({ primaryLine: 'cn("a")', bucketsCommentLine: "// x" }),
    ) as { schemaVersion: number; primaryLine: string };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.primaryLine).toBe('cn("a")');
  });
});
