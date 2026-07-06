import { describe, expect, it } from "vitest";

import { resolveRegion, resolveRegionFromCountryCode } from "#/server/region";

describe("resolveRegionFromCountryCode", () => {
  it.each([
    ["DE", "eu"],
    ["fr", "eu"],
    ["VN", "vn"],
    ["US", "us"],
    ["JP", "other"],
    [undefined, "other"],
  ] as const)("maps %s to %s", (code, region) => {
    expect(resolveRegionFromCountryCode(code)).toBe(region);
  });
});

describe("resolveRegion", () => {
  it("reads the configured geo header", () => {
    const headers = new Headers({ "x-vercel-ip-country": "VN" });

    expect(resolveRegion(headers)).toBe("vn");
  });

  it("falls back to other when the header is absent", () => {
    expect(resolveRegion(new Headers())).toBe("other");
  });
});
