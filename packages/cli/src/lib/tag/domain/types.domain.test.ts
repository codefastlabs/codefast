import type { TagRunOptions, TagSyncResult } from "#lib/tag/domain/types.domain";

describe("tag domain types", () => {
  it("TagRunOptions accepts write flag", () => {
    const opts: TagRunOptions = { write: true };
    expect(opts.write).toBe(true);
  });

  it("TagSyncResult supports dry-run summary fields", () => {
    const summary: Pick<TagSyncResult, "mode" | "filesScanned" | "skippedPackages"> = {
      mode: "dry-run",
      filesScanned: 0,
      skippedPackages: [],
    };
    expect(summary.mode).toBe("dry-run");
  });
});
