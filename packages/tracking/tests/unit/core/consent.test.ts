import { describe, expect, it } from "vitest";

import { resolveConsentMode, shouldTrackByDefault } from "#/core/consent";

describe("resolveConsentMode", () => {
  it.each([
    ["eu", "opt-in"],
    ["vn", "opt-in"],
    ["us", "opt-out"],
    ["other", "opt-out"],
  ] as const)("resolves %s to %s", (region, mode) => {
    expect(resolveConsentMode(region)).toBe(mode);
  });
});

describe("shouldTrackByDefault", () => {
  it("never tracks by default under opt-in, regardless of GPC", () => {
    expect(shouldTrackByDefault("opt-in", false)).toBe(false);
    expect(shouldTrackByDefault("opt-in", true)).toBe(false);
  });

  it("tracks by default under opt-out unless GPC is signaled", () => {
    expect(shouldTrackByDefault("opt-out", false)).toBe(true);
    expect(shouldTrackByDefault("opt-out", true)).toBe(false);
  });
});
