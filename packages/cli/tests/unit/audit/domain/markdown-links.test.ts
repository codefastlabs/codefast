import { describe, expect, it } from "vitest";

import { collectMarkdownAnchors, scanMarkdownLinks } from "#/audit/domain/markdown-links";

describe("collectMarkdownAnchors", () => {
  it("offers explicit anchors and heading slugs", () => {
    const anchors = collectMarkdownAnchors(['<a id="chain-order"></a>', "", "### 2.4 Fluent chain — order"].join("\n"));

    expect(anchors.has("chain-order")).toBe(true);
    // Punctuation drops, spaces hyphenate; the em dash leaves the two spaces around it behind.
    expect(anchors.has("24-fluent-chain-order")).toBe(true);
  });
});

describe("scanMarkdownLinks", () => {
  it("keeps repo-local references and drops the ones another tool owns", () => {
    const { references } = scanMarkdownLinks(
      [
        "[a](./sibling.md)",
        "[b](../up/there.md#frag)",
        "[c](#local)",
        "[d](https://example.com/x)",
        "[e](mailto:someone@example.com)",
        "[f](//cdn.example.com/x)",
      ].join("\n"),
    );

    expect(references).toEqual([
      { line: 1, targetPath: "./sibling.md", anchor: null },
      { line: 2, targetPath: "../up/there.md", anchor: "frag" },
      { line: 3, targetPath: "", anchor: "local" },
    ]);
  });

  it("ignores links inside fenced code, which are examples rather than references", () => {
    const { references } = scanMarkdownLinks(
      ["[real](./real.md)", "", "```md", "[example](./does-not-exist.md)", "```"].join("\n"),
    );

    expect(references.map((reference) => reference.targetPath)).toEqual(["./real.md"]);
  });

  it("reports the line a reference sits on, counting through stripped fences", () => {
    const { references } = scanMarkdownLinks(["```ts", "const x = 1;", "```", "", "[late](./late.md)"].join("\n"));

    expect(references[0]).toMatchObject({ line: 5, targetPath: "./late.md" });
  });
});
