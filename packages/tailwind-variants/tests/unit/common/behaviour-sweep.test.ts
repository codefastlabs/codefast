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

  test("a resolver's first answer is exactly what its compiled plan answers", () => {
    const compiled = collectSweepOutcomes({});
    const firstCalls = collectSweepOutcomes({}, { freshResolverPerCall: true });

    expect(firstCalls).toHaveLength(compiled.length);

    const divergences = compiled
      .map((line, index) => ({ line, other: firstCalls[index] }))
      .filter((pair) => pair.line !== pair.other)
      .slice(0, 10);

    expect(divergences).toEqual([]);
  });

  test("the sweep is large enough to be worth running", () => {
    expect(collectSweepOutcomes({}).length).toBeGreaterThan(50_000);
  });
});
