/**
 * Brandi — the optional resolve rows through `token.optional`: `get()` answers the value when the
 * token is bound and `undefined` when it is not.
 */
import { createContainer, token } from "brandi";

import {
  OPTIONAL_HIT_BATCH,
  OPTIONAL_MISS_BATCH,
  RESOLVE_OPTIONAL_HIT,
  RESOLVE_OPTIONAL_MISS,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const PRESENT = token<number>("bench-brandi-rp-optional-hit");
const ABSENT = token<string>("bench-brandi-rp-optional-miss");

function buildResolveOptionalHitScenario(): BenchScenario {
  const container = createContainer();
  container.bind(PRESENT).toConstant(42);
  container.get(PRESENT.optional);

  return {
    ...RESOLVE_OPTIONAL_HIT,
    what: "get(token.optional) when the binding exists — returns the value without throwing",
    batch: OPTIONAL_HIT_BATCH,
    sanity: () => container.get(PRESENT.optional) === 42,
    build: () =>
      batched(OPTIONAL_HIT_BATCH, () => {
        container.get(PRESENT.optional);
      }),
  };
}

function buildResolveOptionalMissScenario(): BenchScenario {
  const container = createContainer();
  container.get(ABSENT.optional);

  return {
    ...RESOLVE_OPTIONAL_MISS,
    what: "get(token.optional) when no binding exists — returns undefined without throwing",
    batch: OPTIONAL_MISS_BATCH,
    sanity: () => container.get(ABSENT.optional) === undefined,
    build: () =>
      batched(OPTIONAL_MISS_BATCH, () => {
        container.get(ABSENT.optional);
      }),
  };
}

/**
 * Builds brandi's optional resolve scenarios.
 */
export function buildBrandiResolutionPatternScenarios(): ReadonlyArray<BenchScenario> {
  return [buildResolveOptionalHitScenario(), buildResolveOptionalMissScenario()];
}
