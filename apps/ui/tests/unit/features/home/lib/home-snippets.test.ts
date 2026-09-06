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
    expect(quickStart).toContain("OrderService");
    expect(quickStart).toContain("@codefast/di");
    expect(testBed).toContain("TestBed");
    expect(testBed).toContain("@codefast/di-testing");
    expect(testBed).toContain("OrderService");
    expect(rightList).toContain("LoggerToken");
    expect(rightList).not.toContain("ShopConfigToken");
    expect(wrongList).toContain("ShopConfigToken");
    expect(decorators).toContain("postConstruct");
    expect(decorators).toContain("ReceiptMailer");
  });
});
