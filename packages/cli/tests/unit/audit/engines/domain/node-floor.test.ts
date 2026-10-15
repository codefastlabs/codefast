import { describe, expect, it } from "vitest";

import { formatNodeVersion, parseNodeFloor, parseNodeVersion, typesFitFloor } from "#audit/engines/domain/node-floor";

describe("parseNodeFloor", () => {
  it("reads a >=X.Y.Z floor, with or without a space", () => {
    expect(parseNodeFloor(">=22.12.0")).toEqual([22, 12, 0]);
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

describe("typesFitFloor", () => {
  it("holds on the floor's major at a minor no newer, whatever the patch", () => {
    expect(typesFitFloor([22, 12, 9], [22, 12, 0])).toBe(true);
    expect(typesFitFloor([22, 12, 0], [22, 18, 0])).toBe(true);
  });

  it("fails for a newer minor or another major", () => {
    expect(typesFitFloor([22, 13, 0], [22, 12, 0])).toBe(false);
    expect(typesFitFloor([24, 0, 0], [22, 12, 0])).toBe(false);
    expect(typesFitFloor([20, 19, 0], [22, 12, 0])).toBe(false);
  });
});

describe("formatNodeVersion", () => {
  it("joins the parts with dots", () => {
    expect(formatNodeVersion([22, 12, 0])).toBe("22.12.0");
  });
});
