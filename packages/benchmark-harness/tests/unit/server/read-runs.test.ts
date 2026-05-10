import { describe, expect, it } from "vitest";

import { listRawRuns } from "#/server/read-runs";

describe("listRawRuns", () => {
  it("returns a warning when the directory does not exist", () => {
    const missingPath = "/nonexistent/bench-results-dir";
    const result = listRawRuns(missingPath);
    expect(result.runs).toEqual([]);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain("Could not read bench results directory");
    expect(result.warning).toContain(missingPath);
  });
});
