import GithubSlugger, { slug as githubSlug } from "github-slugger";
import { describe, expect, it } from "vitest";

import { Slugger, plainHeadingText, slugify } from "#features/package-docs/lib/markdown/slug";

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

describe("slugify", () => {
  it("follows the GitHub rule the link audit checks anchors against", () => {
    // The em dash drops but its two surrounding spaces stay, so runs are not collapsed — a double hyphen.
    expect(slugify("2.1 Naming — no `I` or `T` prefix")).toBe("21-naming--no-i-or-t-prefix");
    expect(slugify("  What InversifyJS v8 solved ")).toBe("what-inversifyjs-v8-solved");
    expect(slugify("`BindingScope`")).toBe("bindingscope");
    // Underscores are slug characters on GitHub, so a `use_client` heading keeps its underscore.
    expect(slugify("use_client boundary")).toBe("use_client-boundary");
  });

  it("keeps letters outside ASCII", () => {
    expect(slugify("Tổng quan")).toBe("tổng-quan");
  });
});

describe("matches github-slugger", () => {
  // The GitHub algorithm itself is the oracle, so this renderer and the link audit stay pinned to it — and to each other.
  it.each(HEADINGS)("slugs %j exactly as GitHub does", (heading) => {
    expect(slugify(heading)).toBe(githubSlug(heading));
  });
});

describe("Slugger", () => {
  it("suffixes duplicate headings like GitHub", () => {
    const slugger = new Slugger();

    expect(slugger.slug("Usage")).toBe("usage");
    expect(slugger.slug("Usage")).toBe("usage-1");
    expect(slugger.slug("Usage")).toBe("usage-2");
  });

  it("disambiguates a run of headings exactly as github-slugger does", () => {
    const ours = new Slugger();
    const oracle = new GithubSlugger();
    const run = ["Usage", "Usage", "Overview", "Usage", "Overview"];

    expect(run.map((heading) => ours.slug(heading))).toStrictEqual(run.map((heading) => oracle.slug(heading)));
  });
});

describe("plainHeadingText", () => {
  it("strips inline markdown for labels", () => {
    expect(plainHeadingText("3.1 `BindingScope`")).toBe("3.1 BindingScope");
    expect(plainHeadingText("See [the spec](./SPEC.md) **now**")).toBe("See the spec now");
  });
});
