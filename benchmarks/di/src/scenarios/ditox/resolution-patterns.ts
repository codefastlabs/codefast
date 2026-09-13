/**
 * Ditox — the optional resolve rows through `get()`, which answers `undefined` for an unbound token
 * where `resolve()` would throw.
 */
import { createContainer, token } from "ditox";

import {
  OPTIONAL_HIT_BATCH,
  OPTIONAL_MISS_BATCH,
  RESOLVE_OPTIONAL_HIT,
  RESOLVE_OPTIONAL_MISS,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const PRESENT = token<number>("bench-ditox-rp-optional-hit");
const ABSENT = token<string>("bench-ditox-rp-optional-miss");

function buildResolveOptionalHitScenario(): BenchScenario {
  const container = createContainer();
  container.bindValue(PRESENT, 42);
  container.get(PRESENT);

  return {
    ...RESOLVE_OPTIONAL_HIT,
    what: "get(token) when the binding exists — returns the value without throwing",
    batch: OPTIONAL_HIT_BATCH,
    sanity: () => container.get(PRESENT) === 42,
    build: () =>
      batched(OPTIONAL_HIT_BATCH, () => {
        container.get(PRESENT);
      }),
  };
}

function buildResolveOptionalMissScenario(): BenchScenario {
  const container = createContainer();
  container.get(ABSENT);

  return {
    ...RESOLVE_OPTIONAL_MISS,
    what: "get(token) when no binding exists — returns undefined without throwing",
    batch: OPTIONAL_MISS_BATCH,
    sanity: () => container.get(ABSENT) === undefined,
    build: () =>
      batched(OPTIONAL_MISS_BATCH, () => {
        container.get(ABSENT);
      }),
  };
}

/**
 * Builds ditox's optional resolve scenarios.
 *
 * @since 0.8.0
 */
export function buildDitoxResolutionPatternScenarios(): ReadonlyArray<BenchScenario> {
  return [buildResolveOptionalHitScenario(), buildResolveOptionalMissScenario()];
}
