import { describe, expect, it } from "vitest";

import { compareVersionPrecedence, scanImpossibleSinceTags } from "#/audit/domain/since-versions";

describe("compareVersionPrecedence", () => {
  it("orders the numeric core", () => {
    expect(compareVersionPrecedence("1.0.0", "0.7.0")).toBeGreaterThan(0);
    expect(compareVersionPrecedence("0.5.0", "0.5.1")).toBeLessThan(0);
    expect(compareVersionPrecedence("0.7.0", "0.7.0")).toBe(0);
  });

  it("ranks a pre-release below the release it precedes", () => {
    expect(compareVersionPrecedence("0.7.0-canary.3", "0.7.0")).toBeLessThan(0);
    expect(compareVersionPrecedence("0.7.0", "0.7.0-canary.3")).toBeGreaterThan(0);
  });

  it("orders pre-release identifiers numerically and by count", () => {
    expect(compareVersionPrecedence("1.0.0-canary.7", "1.0.0-canary.6")).toBeGreaterThan(0);
    expect(compareVersionPrecedence("1.0.0-canary.10", "1.0.0-canary.9")).toBeGreaterThan(0);
    expect(compareVersionPrecedence("1.0.0-canary", "1.0.0-canary.1")).toBeLessThan(0);
    expect(compareVersionPrecedence("1.0.0-1", "1.0.0-canary")).toBeLessThan(0);
  });

  it("ignores build metadata and rejects non-versions", () => {
    expect(compareVersionPrecedence("1.0.0+build.5", "1.0.0")).toBe(0);
    expect(compareVersionPrecedence("not-a-version", "1.0.0")).toBeNull();
    expect(compareVersionPrecedence("1.0", "1.0.0")).toBeNull();
  });
});

describe("scanImpossibleSinceTags", () => {
  const docBlock = (version: string): string =>
    ["/**", " * Does a thing.", " *", ` * @since ${version}`, " */"].join("\n");

  it("flags a stamp above the package version", () => {
    const findings = scanImpossibleSinceTags(docBlock("1.0.0-canary.6"), "0.7.0");

    expect(findings).toEqual([{ line: 4, raw: "@since 1.0.0-canary.6" }]);
  });

  it("accepts stamps at or below the package version, including canaries", () => {
    expect(scanImpossibleSinceTags(docBlock("0.5.0-canary.6"), "0.7.0")).toEqual([]);
    expect(scanImpossibleSinceTags(docBlock("0.7.0"), "0.7.0")).toEqual([]);
    expect(scanImpossibleSinceTags(docBlock("0.7.0-canary.1"), "0.7.0")).toEqual([]);
  });

  it("flags a stable stamp while the package sits on its pre-release", () => {
    expect(scanImpossibleSinceTags(docBlock("0.8.0"), "0.8.0-canary.2")).toEqual([{ line: 4, raw: "@since 0.8.0" }]);
  });

  it("stays quiet on unparseable stamps and package versions", () => {
    expect(scanImpossibleSinceTags(docBlock("next"), "0.7.0")).toEqual([]);
    expect(scanImpossibleSinceTags(docBlock("1.0.0"), "workspace:*")).toEqual([]);
  });

  it("reads only comment lines", () => {
    const code = 'const label = "@since 9.9.9";';

    expect(scanImpossibleSinceTags(code, "0.7.0")).toEqual([]);
  });
});
