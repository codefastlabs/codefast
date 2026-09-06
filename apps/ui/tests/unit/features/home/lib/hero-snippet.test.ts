import { describe, expect, it } from "vitest";

import { highlightHeroSnippet } from "#/features/home/lib/hero-snippet.impl";

describe("highlightHeroSnippet", () => {
  it("renders the flagship quick start as a dual-theme Shiki tree", async () => {
    const html = await highlightHeroSnippet();

    expect(html).toContain('class="shiki');
    expect(html).toContain("--shiki-dark");
    expect(html).toContain("CheckoutService");
    expect(html).toContain("@codefast/di");
    expect(html).not.toMatch(/\n\s*$/);
  });
});
