import { describe, expect, it } from "vitest";

import {
  compareNodeVersions,
  formatNodeVersion,
  isOnReleaseLine,
  parseNodeFloor,
  parseNodeVersion,
} from "#audit/engines/domain/node-floor";

describe("parseNodeFloor", () => {
  it("reads a >=X.Y.Z floor, with or without a space", () => {
    expect(parseNodeFloor(">=24.0.0")).toEqual([24, 0, 0]);
    expect(parseNodeFloor(">= 24.14.1")).toEqual([24, 14, 1]);
  });

  it.each(["^24.0.0", "24", ">=24", ">=24.0.0 <27", "*", "lts/*"])("refuses %s", (range) => {
    expect(parseNodeFloor(range)).toBeNull();
  });
});

describe("parseNodeVersion", () => {
  it("reads a resolved version and ignores a peer suffix", () => {
    expect(parseNodeVersion("24.0.15")).toEqual([24, 0, 15]);
    expect(parseNodeVersion("26.0.1(typescript@7.0.2)")).toEqual([26, 0, 1]);
  });

  it("refuses anything that is not a version", () => {
    expect(parseNodeVersion("link:../types")).toBeNull();
  });
});

describe("compareNodeVersions", () => {
  it("orders by major, then minor, then patch", () => {
    expect(compareNodeVersions([24, 0, 0], [26, 0, 0])).toBeLessThan(0);
    expect(compareNodeVersions([24, 14, 0], [24, 4, 9])).toBeGreaterThan(0);
    expect(compareNodeVersions([24, 0, 1], [24, 0, 1])).toBe(0);
  });
});

describe("isOnReleaseLine", () => {
  it("holds for the same major and minor, whatever the patch", () => {
    expect(isOnReleaseLine([24, 0, 15], [24, 0, 0])).toBe(true);
    expect(isOnReleaseLine([24, 4, 0], [24, 0, 0])).toBe(false);
    expect(isOnReleaseLine([26, 0, 0], [24, 0, 0])).toBe(false);
  });
});

describe("formatNodeVersion", () => {
  it("joins the parts with dots", () => {
    expect(formatNodeVersion([24, 0, 0])).toBe("24.0.0");
  });
});
