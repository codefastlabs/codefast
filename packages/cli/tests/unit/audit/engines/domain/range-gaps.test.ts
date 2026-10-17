import { describe, expect, it } from "vitest";

import { shortLivedMajors, uncoveredNodeRanges } from "#audit/engines/domain/range-gaps";

describe("uncoveredNodeRanges", () => {
  it("finds nothing when the range admits every release from the floor up", () => {
    expect(uncoveredNodeRanges([22, 12, 0], ">=22.12.0")).toEqual([]);
    expect(uncoveredNodeRanges([24, 0, 0], ">=22.12.0")).toEqual([]);
    expect(uncoveredNodeRanges([22, 12, 0], "*")).toEqual([]);
  });

  it("joins ranges that touch, so a caret followed by the next major leaves no gap", () => {
    expect(uncoveredNodeRanges([22, 12, 0], "^22.12.0 || ^23.0.0 || >=24.0.0")).toEqual([]);
    expect(uncoveredNodeRanges([22, 12, 0], ">=22.12.0 <24.0.0 || >=24.0.0")).toEqual([]);
  });

  it("finds the gap a range leaves above a floor it admits", () => {
    expect(uncoveredNodeRanges([22, 18, 0], "^22.18.0 || >=24.11.0")).toEqual([">=23.0.0 <24.11.0"]);
    expect(uncoveredNodeRanges([22, 12, 0], "^22.12.0 || >=24.0.0")).toEqual([">=23.0.0 <24.0.0"]);
  });

  it("never counts a release on an unjudged major as left out", () => {
    expect(uncoveredNodeRanges([22, 12, 0], "^22.12.0 || >=24.0.0", [23])).toEqual([]);
    expect(uncoveredNodeRanges([22, 22, 2], "^22.22.2 || ^24.15.0 || >=26.0.0", [23, 25])).toEqual([
      ">=24.0.0 <24.15.0",
    ]);
  });

  it("finds the stretch below the range's own start when the floor sits under it", () => {
    expect(uncoveredNodeRanges([22, 0, 0], "^22.12.0 || ^24.0.0 || >=26.0.0")).toEqual([
      ">=22.0.0 <22.12.0",
      ">=23.0.0 <24.0.0",
      ">=25.0.0 <26.0.0",
    ]);
  });

  it("finds an open tail when the range has an upper bound", () => {
    expect(uncoveredNodeRanges([22, 12, 0], ">=20.0.0 <25.0.0")).toEqual([">=25.0.0"]);
    expect(uncoveredNodeRanges([22, 12, 0], "<=24.5.0")).toEqual([">24.5.0"]);
  });

  it("ignores ranges that end below the floor", () => {
    expect(uncoveredNodeRanges([24, 0, 0], "^20.0.0 || ^22.0.0 || >=24.0.0")).toEqual([]);
  });

  it("leaves out a single excluded release, and reads an exact version as one release", () => {
    expect(uncoveredNodeRanges([24, 0, 0], "<24.5.0 || >24.5.0")).toEqual([">=24.5.0 <=24.5.0"]);
    expect(uncoveredNodeRanges([24, 0, 0], "24.0.0")).toEqual([">24.0.0"]);
  });

  it("leaves everything out when the range admits nothing", () => {
    expect(uncoveredNodeRanges([24, 0, 0], "<0.0.0-0")).toEqual([">=24.0.0"]);
  });

  it("returns null for a range no semver parser reads", () => {
    expect(uncoveredNodeRanges([22, 12, 0], "node >= 0.8")).toBeNull();
  });
});

describe("shortLivedMajors", () => {
  it("lists the odd majors above the floor's and below the newest tested one", () => {
    expect(shortLivedMajors([22, 12, 0], [26, 8, 2])).toEqual([23, 25]);
    expect(shortLivedMajors([24, 0, 0], [28, 0, 0])).toEqual([25, 27]);
  });

  it("keeps the floor's own line and the newest line judged", () => {
    expect(shortLivedMajors([23, 0, 0], [25, 1, 0])).toEqual([]);
  });

  it("judges every line when no newest release is known", () => {
    expect(shortLivedMajors([22, 12, 0], null)).toEqual([]);
  });
});
