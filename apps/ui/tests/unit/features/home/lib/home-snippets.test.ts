import { describe, expect, it } from "vitest";

import { SHOP_TESTS } from "#/features/home/demos/shop-tests";
import { highlightHomeSnippets } from "#/features/home/lib/home-snippets.impl";

describe("highlightHomeSnippets", () => {
  it("renders every sample as a dual-theme Shiki tree", async () => {
    const { quickStart, testBed, rightList, wrongList, decorators } = await highlightHomeSnippets();

    for (const html of [
      quickStart,
      testBed.imports,
      ...testBed.tests.map((test) => test.html),
      rightList,
      wrongList,
      decorators.imports,
      decorators.body,
    ]) {
      expect(html).toContain('class="shiki');
      expect(html).toContain("--shiki-dark");
      expect(html).not.toMatch(/\n\s*$/);
    }
    expect(quickStart).toContain("OrderService");
    expect(quickStart).toContain("@codefast/di");
    expect(rightList).toContain("LoggerToken");
    expect(rightList).not.toContain("ShopConfigToken");
    expect(wrongList).toContain("ShopConfigToken");
    expect(decorators.imports).toContain("@codefast/di");
    expect(decorators.imports).not.toContain("ReceiptMailer");
    expect(decorators.body).toContain("postConstruct");
    expect(decorators.body).toContain("ReceiptMailer");
    expect(decorators.body).not.toContain("import");
  });

  it("splits the test file into its imports and one body per test, titled as the sample states them", async () => {
    const { testBed } = await highlightHomeSnippets();

    expect(testBed.imports).toContain("@codefast/di-testing");
    expect(testBed.imports).toContain("./shop");
    expect(testBed.imports).not.toContain("it(");
    expect(testBed.tests.map((test) => test.title)).toEqual(SHOP_TESTS.map((test) => test.title));
    expect(testBed.tests[0]?.html).toContain("TestBed");
    expect(testBed.tests[3]?.html).toContain("UndeclaredDependencyError");
  });
});
