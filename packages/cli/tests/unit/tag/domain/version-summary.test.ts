import { describe, expect, it } from "vitest";

import { extractDistinctVersions, summarizeVersions } from "#tag/domain/version-summary";

// extractDistinctVersions reads only `.result?.version`, which is all its parameter asks for.
function targetWithVersion(version: string | undefined): { readonly result: { readonly version: string } | null } {
  return { result: version === undefined ? null : { version } };
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
