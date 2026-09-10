/**
 * injection-js — child-scope benchmark. Parallel to `../codefast/scope.ts`'s
 * `child-depth-2-resolve`: a root injector provides a constant, and a depth-2
 * child resolves it by delegating up its parent chain. `ReflectiveInjector`
 * resolves an ancestor-provided token in that ancestor (not the child), so the
 * child delegates on every `get` — the same two-level walk di and ditox do.
 */
import "reflect-metadata";
import { InjectionToken, ReflectiveInjector } from "injection-js";

import { CHILD_DEPTH_2_RESOLVE, CHILD_RESOLVE_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const childScopeLeafToken = new InjectionToken<number>("bench-injection-js-child2-leaf");
  const rootInjector = ReflectiveInjector.resolveAndCreate([{ provide: childScopeLeafToken, useValue: 42 }]);
  const firstLevelChildInjector = rootInjector.resolveAndCreateChild([]);
  const secondLevelChildInjector = firstLevelChildInjector.resolveAndCreateChild([]);
  secondLevelChildInjector.get(childScopeLeafToken);

  return {
    ...CHILD_DEPTH_2_RESOLVE,
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => secondLevelChildInjector.get(childScopeLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        secondLevelChildInjector.get(childScopeLeafToken);
      }),
  };
}

/**
 * Builds injection-js's child-scope benchmark scenarios.
 */
export function buildInjectionJsScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [buildChildDepthTwoResolveScenario()];
}
