import { describe, expect, it } from "vitest";

import {
  countHeadMentions,
  isPathLinkTarget,
  linkTargetHead,
  scanLinkReferences,
} from "#/audit/domain/link-references";

const link = (target: string): string => "{@" + `link ${target}}`;

describe("scanLinkReferences", () => {
  it("collects targets from comment lines only", () => {
    const source = [
      `/** Writes rows the way ${link("writeJsonlRun")} does. */`,
      `const fixture = "${link("notScanned")}";`,
      `// see also ${link("Foo.bar")} and ${link("../fixtures/adapter.ts")}`,
    ].join("\n");

    expect(scanLinkReferences(source).map((reference) => reference.target)).toStrictEqual([
      "writeJsonlRun",
      "Foo.bar",
      "../fixtures/adapter.ts",
    ]);
  });
});

describe("linkTargetHead", () => {
  it("resolves a member reference through its head", () => {
    expect(linkTargetHead("Foo.bar")).toBe("Foo");
    expect(linkTargetHead("Foo#bar")).toBe("Foo");
    expect(linkTargetHead("plain")).toBe("plain");
  });
});

describe("isPathLinkTarget", () => {
  it("separates file and URL targets from declarations", () => {
    expect(isPathLinkTarget("../fixtures/adapter.ts")).toBe(true);
    expect(isPathLinkTarget("./sibling.ts")).toBe(true);
    expect(isPathLinkTarget("https://example.com")).toBe(true);
    expect(isPathLinkTarget("writeJsonlRun")).toBe(false);
  });
});

describe("countHeadMentions", () => {
  it("counts word-boundary occurrences across every scanned file", () => {
    const counts = countHeadMentions(
      ["function writeJsonlRun() {}", `/** ${link("writeJsonlRun")} */\nwriteJsonlRunner();`],
      new Set(["writeJsonlRun"]),
    );

    // The declaration and the link itself count; `writeJsonlRunner` does not.
    expect(counts.get("writeJsonlRun")).toBe(2);
  });
});
