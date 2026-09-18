import { beforeAll, describe, expect, test } from "vitest";

import { collectSweepOutcomes } from "#tests/unit/support/behaviour-sweep";

// The corpus is walked under v8 coverage, so compute the shared base once and give each comparison its
// own budget: on a saturated CI runner a single sweep can outlive the default per-test timeout.
const SWEEP_TIMEOUT_MS = 20_000;

describe("behaviour sweep", () => {
  let base: ReadonlyArray<string>;

  beforeAll(() => {
    base = collectSweepOutcomes({});
  }, SWEEP_TIMEOUT_MS);

  test(
    "a resolver that remembers answers exactly what one that does not answers",
    () => {
      const resolvedEachTime = collectSweepOutcomes({ cacheResolutions: false });

      expect(base).toHaveLength(resolvedEachTime.length);

      // Report the outcomes themselves rather than a count, so a failure names the case it came from.
      const divergences = base
        .map((line, index) => ({ line, other: resolvedEachTime[index] }))
        .filter((pair) => pair.line !== pair.other)
        .slice(0, 10);

      expect(divergences).toEqual([]);
    },
    SWEEP_TIMEOUT_MS,
  );

  test(
    "a resolver's first answer is exactly what its compiled plan answers",
    () => {
      const firstCalls = collectSweepOutcomes({}, { freshResolverPerCall: true });

      expect(firstCalls).toHaveLength(base.length);

      const divergences = base
        .map((line, index) => ({ line, other: firstCalls[index] }))
        .filter((pair) => pair.line !== pair.other)
        .slice(0, 10);

      expect(divergences).toEqual([]);
    },
    SWEEP_TIMEOUT_MS,
  );

  test("the sweep is large enough to be worth running", () => {
    expect(base.length).toBeGreaterThan(50_000);
  });
});
