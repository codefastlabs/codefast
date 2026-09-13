/**
 * injection-js — child-scope benchmarks. Parallel to `../codefast/scope.ts`'s
 * `child-depth-N-resolve`: a root injector provides a constant, and a child N levels
 * down resolves it by delegating up its parent chain. `ReflectiveInjector`
 * resolves an ancestor-provided token in that ancestor (not the child), so the
 * child delegates on every `get` — the same two-level walk di and ditox do.
 */
import "reflect-metadata";
import { InjectionToken, ReflectiveInjector } from "injection-js";

import { CHILD_DEPTHS, CHILD_RESOLVE_BATCH, childDepthResolveDescriptor } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildChildDepthResolveScenario(depth: number): BenchScenario {
  const childScopeLeafToken = new InjectionToken<number>(`bench-injection-js-child${String(depth)}-leaf`);
  const rootInjector = ReflectiveInjector.resolveAndCreate([{ provide: childScopeLeafToken, useValue: 42 }]);
  let deepestInjector = rootInjector;
  for (let level = 0; level < depth; level++) {
    deepestInjector = deepestInjector.resolveAndCreateChild([]);
  }
  deepestInjector.get(childScopeLeafToken);

  return {
    ...childDepthResolveDescriptor(depth),
    what: `get() a root provider from a depth-${String(depth)} resolveAndCreateChild() chain — the parent walk a per-request injector pays`,
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => deepestInjector.get(childScopeLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        deepestInjector.get(childScopeLeafToken);
      }),
  };
}

/**
 * Builds injection-js's child-scope benchmark scenarios.
 */
export function buildInjectionJsScopeScenarios(): ReadonlyArray<BenchScenario> {
  return CHILD_DEPTHS.map((depth) => buildChildDepthResolveScenario(depth));
}
