/**
 * injection-js — the optional resolve rows through `get(token, notFoundValue)`: the value when the
 * token is provided, the not-found value when it is not.
 */
import "reflect-metadata";
import { InjectionToken, ReflectiveInjector } from "injection-js";

import {
  OPTIONAL_HIT_BATCH,
  OPTIONAL_MISS_BATCH,
  RESOLVE_OPTIONAL_HIT,
  RESOLVE_OPTIONAL_MISS,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const PRESENT = new InjectionToken<number>("bench-injection-js-rp-optional-hit");
const ABSENT = new InjectionToken<string>("bench-injection-js-rp-optional-miss");

function buildResolveOptionalHitScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([{ provide: PRESENT, useValue: 42 }]);
  injector.get(PRESENT, null);

  return {
    ...RESOLVE_OPTIONAL_HIT,
    what: "get(token, null) when the provider exists — returns the value without throwing",
    batch: OPTIONAL_HIT_BATCH,
    sanity: () => injector.get(PRESENT, null) === 42,
    build: () =>
      batched(OPTIONAL_HIT_BATCH, () => {
        injector.get(PRESENT, null);
      }),
  };
}

function buildResolveOptionalMissScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate([]);
  injector.get(ABSENT, null);

  return {
    ...RESOLVE_OPTIONAL_MISS,
    what: "get(token, null) when no provider exists — returns the not-found value without throwing",
    batch: OPTIONAL_MISS_BATCH,
    sanity: () => injector.get(ABSENT, null) === null,
    build: () =>
      batched(OPTIONAL_MISS_BATCH, () => {
        injector.get(ABSENT, null);
      }),
  };
}

/**
 * Builds injection-js's optional resolve scenarios.
 *
 * @since 0.8.0
 */
export function buildInjectionJsResolutionPatternScenarios(): ReadonlyArray<BenchScenario> {
  return [buildResolveOptionalHitScenario(), buildResolveOptionalMissScenario()];
}
