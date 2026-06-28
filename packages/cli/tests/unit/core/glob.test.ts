import { describe, expect, it } from "vitest";

import { createAnyGlobMatcher } from "#/core/glob";

describe("createAnyGlobMatcher", () => {
  it("matches nothing when no patterns are configured", () => {
    expect(createAnyGlobMatcher(undefined)("@apps/web")).toBe(false);
    expect(createAnyGlobMatcher([])("@apps/web")).toBe(false);
  });

  it("matches an exact name", () => {
    const isMatch = createAnyGlobMatcher(["@apps/web"]);
    expect(isMatch("@apps/web")).toBe(true);
    expect(isMatch("@apps/start-demo")).toBe(false);
    expect(isMatch("@codefast/ui")).toBe(false);
  });

  it("matches every name in a scope via a `*` glob without crossing `/`", () => {
    const isMatch = createAnyGlobMatcher(["@apps/*"]);
    expect(isMatch("@apps/web")).toBe(true);
    expect(isMatch("@apps/start-demo")).toBe(true);
    expect(isMatch("@codefast/ui")).toBe(false);
    expect(isMatch("@apps/nested/pkg")).toBe(false);
  });

  it("matches when any of several patterns matches", () => {
    const isMatch = createAnyGlobMatcher(["@apps/*", "@codefast/cli"]);
    expect(isMatch("@apps/web")).toBe(true);
    expect(isMatch("@codefast/cli")).toBe(true);
    expect(isMatch("@codefast/ui")).toBe(false);
  });

  it("honors picomatch options such as `dot`", () => {
    expect(createAnyGlobMatcher(["packages/*"])(".cache/pkg")).toBe(false);
    expect(createAnyGlobMatcher(["*"], { dot: true })(".cache")).toBe(true);
    expect(createAnyGlobMatcher(["*"])(".cache")).toBe(false);
  });
});
