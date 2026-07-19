import { describe, expect, it } from "vitest";

import { resolveRegionFromCountryCode } from "#/server/region";

describe("resolveRegionFromCountryCode", () => {
  it.each([
    ["DE", "eu"],
    ["fr", "eu"],
    ["GB", "eu"],
    ["IS", "eu"],
    ["LI", "eu"],
    ["NO", "eu"],
    ["VN", "vn"],
    ["US", "us"],
    ["JP", "other"],
    [undefined, "other"],
  ] as const)("maps %s to %s", (code, region) => {
    expect(resolveRegionFromCountryCode(code)).toBe(region);
  });
});
