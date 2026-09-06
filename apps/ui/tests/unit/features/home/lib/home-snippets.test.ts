import { describe, expect, it } from "vitest";

import { highlightHomeSnippets } from "#/features/home/lib/home-snippets.impl";

describe("highlightHomeSnippets", () => {
  it("renders every sample as a dual-theme Shiki tree", async () => {
    const { quickStart, testBed, rightList, wrongList, decorators } = await highlightHomeSnippets();

    for (const html of [quickStart, testBed, rightList, wrongList, decorators]) {
      expect(html).toContain('class="shiki');
      expect(html).toContain("--shiki-dark");
      expect(html).not.toMatch(/\n\s*$/);
    }
    expect(quickStart).toContain("CheckoutService");
    expect(quickStart).toContain("@codefast/di");
    expect(testBed).toContain("TestBed");
    expect(testBed).toContain("@codefast/di-testing");
    expect(rightList).toContain("LoggerToken");
    expect(rightList).not.toContain("ClockToken");
    expect(wrongList).toContain("ClockToken");
    expect(decorators).toContain("postConstruct");
  });
});
