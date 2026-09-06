import { describe, expect, it } from "vitest";

import { runShopTests } from "#/features/home/demos/shop-test-run";
import { SHOP_TESTS } from "#/features/home/demos/shop-tests";

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
    expect(SHOP_TESTS.map((test) => test.title)).toEqual(titles);
    expect(runShopTests().map((result) => result.name)).toEqual(titles);
  });

  it("keeps every line of the sample inside the card's column", () => {
    const source = Object.values(sample)[0] ?? "";
    const overlong = source.split("\n").filter((line) => line.length > 76);

    expect(overlong).toEqual([]);
  });

  it("reports what each test observed, as the expression the sample reads and the value it held", () => {
    const observations = runShopTests().map((result) => result.observations);

    expect(observations[0]).toEqual([{ expression: "reserve.mock.calls[0]", value: '["SKU-42"]' }]);
    expect(observations[1]).toEqual([
      { expression: 'place("SKU-42")', value: '"pay-1"' },
      { expression: "charge.mock.calls[0]", value: '[{ amount: 42, currency: "USD" }]' },
    ]);
    expect(observations[2]).toEqual([{ expression: "info.mock.calls[0]", value: '["req-7: SKU-42 → pay-1"]' }]);
    expect(observations[3]).toEqual([{ expression: "compile()", value: "throws UNDECLARED_DEPENDENCY" }]);
  });
});
