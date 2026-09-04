import { describe, expect, it } from "vitest";

import { hasUncommittedTrackedChanges } from "#/pack-slim/working-tree";

describe("hasUncommittedTrackedChanges", () => {
  it("is false for empty or whitespace-only porcelain output", () => {
    expect(hasUncommittedTrackedChanges("")).toBe(false);
    expect(hasUncommittedTrackedChanges("\n")).toBe(false);
    expect(hasUncommittedTrackedChanges("   \n  \n")).toBe(false);
  });

  it("is true when a tracked file is staged or modified", () => {
    expect(hasUncommittedTrackedChanges(" M packages/di/package.json\n")).toBe(true);
    expect(hasUncommittedTrackedChanges("A  packages/cli/src/x.ts\n D README.md\n")).toBe(true);
  });
});
