import { describe, expect, it } from "vitest";

import type { TagTargetExecutionResult } from "#/tag/domain/types";
import { extractDistinctVersions, summarizeVersions } from "#/tag/domain/version-summary";

// extractDistinctVersions only reads `.result?.version`, so a minimal stub stands in for the full result.
function targetWithVersion(version: string | undefined): TagTargetExecutionResult {
  return {
    targetExists: true,
    runError: null,
    result: version === undefined ? null : { version },
  } as unknown as TagTargetExecutionResult;
}

describe("summarizeVersions", () => {
  it("reports none, the single version, or mixed", () => {
    expect(summarizeVersions(new Set())).toBe("none");
    expect(summarizeVersions(new Set(["1.2.3"]))).toBe("1.2.3");
    expect(summarizeVersions(new Set(["1.2.3", "2.0.0"]))).toBe("mixed");
  });
});

describe("extractDistinctVersions", () => {
  it("collects distinct non-empty versions and drops targets with none", () => {
    const versions = extractDistinctVersions([
      targetWithVersion("1.0.0"),
      targetWithVersion("1.0.0"),
      targetWithVersion("2.0.0"),
      targetWithVersion(undefined),
    ]);

    expect([...versions].toSorted()).toEqual(["1.0.0", "2.0.0"]);
  });
});
