/**
 * Awilix — the optional resolve rows: `resolve(name, { allowUnregistered: true })` answers the value
 * when the name is registered and `undefined` when it is not.
 */
import { asValue, createContainer } from "awilix";

import {
  OPTIONAL_HIT_BATCH,
  OPTIONAL_MISS_BATCH,
  RESOLVE_OPTIONAL_HIT,
  RESOLVE_OPTIONAL_MISS,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const ALLOW_UNREGISTERED = { allowUnregistered: true } as const;

function buildResolveOptionalHitScenario(): BenchScenario {
  const container = createContainer();
  container.register({ present: asValue(42) });
  container.resolve<number>("present", ALLOW_UNREGISTERED);

  return {
    ...RESOLVE_OPTIONAL_HIT,
    what: "resolve(name, { allowUnregistered: true }) when the registration exists — returns the value",
    batch: OPTIONAL_HIT_BATCH,
    sanity: () => container.resolve<number>("present", ALLOW_UNREGISTERED) === 42,
    build: () =>
      batched(OPTIONAL_HIT_BATCH, () => {
        container.resolve("present", ALLOW_UNREGISTERED);
      }),
  };
}

function buildResolveOptionalMissScenario(): BenchScenario {
  const container = createContainer();
  container.resolve<number | undefined>("absent", ALLOW_UNREGISTERED);

  return {
    ...RESOLVE_OPTIONAL_MISS,
    what: "resolve(name, { allowUnregistered: true }) when nothing is registered — returns undefined without throwing",
    batch: OPTIONAL_MISS_BATCH,
    sanity: () => container.resolve<number | undefined>("absent", ALLOW_UNREGISTERED) === undefined,
    build: () =>
      batched(OPTIONAL_MISS_BATCH, () => {
        container.resolve("absent", ALLOW_UNREGISTERED);
      }),
  };
}

/**
 * Builds Awilix's optional resolve scenarios.
 */
export function buildAwilixResolutionPatternScenarios(): ReadonlyArray<BenchScenario> {
  return [buildResolveOptionalHitScenario(), buildResolveOptionalMissScenario()];
}
