import { describe, expect, it } from "vitest";
import { formatTagSyncJsonOutput } from "#/lib/tag/application/tag-sync-json.format";
import type { TagSyncResult } from "#/lib/tag/domain/types.domain";

describe("formatTagSyncJsonOutput", () => {
  it("includes schemaVersion and rootDir", () => {
    const result: TagSyncResult = {
      mode: "dry-run",
      selectedTargets: [],
      resolvedTargets: [],
      skippedPackages: [],
      targetResults: [],
      filesScanned: 0,
      filesChanged: 0,
      taggedDeclarations: 0,
      versionSummary: "single",
      distinctVersions: [],
      modifiedFiles: [],
      hookError: null,
    };
    const line = formatTagSyncJsonOutput(result, "/repo");
    const parsed = JSON.parse(line) as { schemaVersion: number; ok: boolean; rootDir: string };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.rootDir).toBe("/repo");
    expect(parsed.ok).toBe(false);
  });
});
