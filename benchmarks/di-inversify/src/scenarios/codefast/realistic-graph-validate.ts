/**
 * `realistic-graph-validate` (codefast-only):
 * Measures the cost of calling `container.validate()` repeatedly on a fixed, already
 * built graph. `validate()` runs the full `validateScopeRules` pass on each call;
 * @codefast/di does **not** epoch-memoize explicit `validate()`. (The dev-only
 * `maybeRunDevValidationOnce` hook on `resolve` is separate.) There is no unbind or
 * registry mutation between the hot-loop calls; this is repeated worst-case static
 * validation work on a warm graph.
 */
import { buildCodefastRealisticContainer } from "#/fixtures/codefast-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const REALISTIC_VALIDATE_BATCH = 10;

function buildRealisticGraphValidateScenario(): BenchScenario {
  const { container } = buildCodefastRealisticContainer(REALISTIC_GRAPH);
  /* Warm a single `validate()` before measurement so the bench closure is the steady
   * path (same as other scenarios that pre-resolve in `build()`). */
  container.validate();

  return {
    id: "realistic-graph-validate",
    group: "realistic",
    what: "statically validate scope rules over a 10-node graph (codefast-only)",
    batch: REALISTIC_VALIDATE_BATCH,
    sanity: () => {
      try {
        container.validate();
        return true;
      } catch {
        return false;
      }
    },
    build: () =>
      batched(REALISTIC_VALIDATE_BATCH, () => {
        container.validate();
      }),
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastRealisticGraphValidateScenarios(): readonly BenchScenario[] {
  return [buildRealisticGraphValidateScenario()];
}
