import { describe, expect, it } from "vitest";

import { runShopTests } from "#/features/home/demos/shop-test-run";

// The sample the testing section shows, so the runnable twin can be held to its titles.
const sample = import.meta.glob<string>("../../../../../src/features/home/demos/shop-test.source.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("runShopTests", () => {
  it("passes every test of the sample in this process", () => {
    const results = runShopTests();

    expect(results).toHaveLength(4);
    expect(results.filter((result) => !result.passed)).toEqual([]);
  });

  it("runs the tests the sample states, under the same titles and in the same order", () => {
    const source = Object.values(sample)[0] ?? "";
    const titles = [...source.matchAll(/^it\("([^"]+)"/gm)].map((match) => match[1]);

    expect(titles).toHaveLength(4);
    expect(runShopTests().map((result) => result.name)).toEqual(titles);
  });

  it("reports what each test checked", () => {
    const evidence = runShopTests().map((result) => result.evidence);

    expect(evidence[0]).toContain('["SKU-42"]');
    expect(evidence[1]).toContain('"pay-1"');
    expect(evidence[2]).toContain("req-7: SKU-42 → pay-1");
    expect(evidence[3]).toContain("UNDECLARED_DEPENDENCY");
  });
});
