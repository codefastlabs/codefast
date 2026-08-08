import { describe, expect, test } from "vitest";

import { collectSweepOutcomes } from "#/tests/unit/support/behaviour-sweep";

describe("behaviour sweep", () => {
  test("a resolver that remembers answers exactly what one that does not answers", () => {
    const remembered = collectSweepOutcomes({});
    const resolvedEachTime = collectSweepOutcomes({ cacheResolutions: false });

    expect(remembered).toHaveLength(resolvedEachTime.length);

    // Report the outcomes themselves rather than a count, so a failure names the case it came from.
    const divergences = remembered
      .map((line, index) => ({ line, other: resolvedEachTime[index] }))
      .filter((pair) => pair.line !== pair.other)
      .slice(0, 10);

    expect(divergences).toEqual([]);
  });

  test("the sweep is large enough to be worth running", () => {
    expect(collectSweepOutcomes({}).length).toBeGreaterThan(50_000);
  });
});
