import { describe, expect, it } from "vitest";

import { scanImpossibleSinceTags } from "#audit/since-versions/domain/since-tags";

const release = (version: string) => ({ name: "@acme/kit", version });

const docBlock = (tag: string): string => ["/**", " * Does a thing.", " *", ` * ${tag}`, " */"].join("\n");

const hint = "delete it; since:stamp stamps the release that ships the symbol";

describe("scanImpossibleSinceTags", () => {
  it("flags a version newer than the package's own, naming the package", () => {
    expect(scanImpossibleSinceTags(docBlock("@since 1.0.0-canary.6"), release("0.7.0"))).toEqual([
      { line: 4, raw: "@since 1.0.0-canary.6", reason: `@since is newer than @acme/kit 0.7.0 — ${hint}` },
    ]);
  });

  it("accepts a version at or below the package's own, canaries included", () => {
    expect(scanImpossibleSinceTags(docBlock("@since 0.5.0-canary.6"), release("0.7.0"))).toEqual([]);
    expect(scanImpossibleSinceTags(docBlock("@since 0.7.0"), release("0.7.0"))).toEqual([]);
    expect(scanImpossibleSinceTags(docBlock("@since 0.7.0-canary.1"), release("0.7.0"))).toEqual([]);
    expect(scanImpossibleSinceTags(docBlock("@since 1.0.0-canary.9"), release("1.0.0-canary.10"))).toEqual([]);
  });

  it("flags the release a package on its pre-release has not reached", () => {
    expect(scanImpossibleSinceTags(docBlock("@since 0.8.0"), release("0.8.0-canary.2"))).toMatchObject([
      { line: 4, raw: "@since 0.8.0" },
    ]);
  });

  it("flags a tag that names no version", () => {
    const reason = `@since names no version — ${hint}`;

    expect(scanImpossibleSinceTags(docBlock("@since next"), release("0.7.0"))).toEqual([
      { line: 4, raw: "@since next", reason },
    ]);
    expect(scanImpossibleSinceTags(docBlock("@since"), release("0.7.0"))).toEqual([{ line: 4, raw: "@since", reason }]);
    expect(scanImpossibleSinceTags(docBlock("@since 1.0"), release("0.7.0"))).toMatchObject([{ raw: "@since 1.0" }]);
  });

  it("reads the version a one-line block names, ahead of its close", () => {
    expect(scanImpossibleSinceTags("/** @since 0.7.0 */", release("0.7.0"))).toEqual([]);
    expect(scanImpossibleSinceTags("/** @since 9.0.0*/", release("0.7.0"))).toMatchObject([{ raw: "@since 9.0.0" }]);
  });

  it("judges nothing when the package's own version does not parse", () => {
    expect(scanImpossibleSinceTags(docBlock("@since 1.0.0"), release("workspace:*"))).toEqual([]);
  });

  it("reads only a comment line's first word", () => {
    const code = ['const label = "@since 9.9.9";', " * stamps `@since 9.9.9` at release", " * @sinceful 9.9.9"].join(
      "\n",
    );

    expect(scanImpossibleSinceTags(code, release("0.7.0"))).toEqual([]);
  });
});
