import GithubSlugger, { slug as githubSlug } from "github-slugger";
import { describe, expect, it } from "vitest";

import { collectMarkdownAnchors, scanMarkdownLinks } from "#audit/links/domain/markdown-links";

// Inputs that exercise where a naive slugger diverges from GitHub — a dot, an em dash with and without
// surrounding spaces, an underscore, a middle dot, parentheses, an ampersand, a colon, and a non-ASCII letter.
const HEADINGS = [
  "Overview",
  "2.4 Fluent chain — order",
  "use_client boundary",
  "P1 · Combinatorial space",
  "What's new",
  "API (v2)",
  "Node.js & Deno",
  "Section 1: intro",
  "Tổng quan",
  "foo—bar",
];

describe("collectMarkdownAnchors", () => {
  it("offers explicit anchors and heading slugs", () => {
    const anchors = collectMarkdownAnchors(['<a id="chain-order"></a>', "", "### 2.4 Fluent chain — order"].join("\n"));

    expect(anchors.has("chain-order")).toBe(true);
    // GitHub drops punctuation and hyphenates each space without collapsing, so the em dash's two
    // surrounding spaces become a double hyphen — matching the id a browser lands on.
    expect(anchors.has("24-fluent-chain--order")).toBe(true);
  });

  it("keeps underscores, which GitHub treats as slug characters", () => {
    const anchors = collectMarkdownAnchors("## use_client boundary");

    expect(anchors.has("use_client-boundary")).toBe(true);
  });

  it("disambiguates repeated headings with GitHub's numeric suffixes", () => {
    const anchors = collectMarkdownAnchors(["# Options", "# Options", "# Options"].join("\n"));

    expect([...anchors]).toStrictEqual(["options", "options-1", "options-2"]);
  });

  it("disambiguates a run of headings exactly as github-slugger does", () => {
    const run = ["Usage", "Usage", "Overview", "Usage", "Overview"];
    const oracle = new GithubSlugger();

    expect([...collectMarkdownAnchors(run.map((heading) => `# ${heading}`).join("\n"))]).toStrictEqual(
      run.map((heading) => oracle.slug(heading)),
    );
  });

  // The GitHub algorithm itself is the oracle, so the audit and the apps/web renderer stay pinned to it — and to each other.
  it.each(HEADINGS)("slugs %j exactly as github-slugger does", (heading) => {
    expect([...collectMarkdownAnchors(`## ${heading}`)]).toStrictEqual([githubSlug(heading)]);
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
