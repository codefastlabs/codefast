/**
 * injection-js — realistic-graph scenarios. The hot row instantiates a fresh
 * transient root over cached singleton deps via `instantiateResolved`; the cold
 * row builds a fresh injector and resolves the root once. The fully-transient
 * fan-out and scale rows have no honest equivalent (sub-deps stay cached
 * singletons) and are omitted.
 */
import {
  buildInjectionJsRealisticInjector,
  sanityCheckInjectionJsRealisticColdResolve,
  sanityCheckInjectionJsRealisticTransientRoot,
} from "#/fixtures/injection-js-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_COLD_RESOLVE,
  REALISTIC_GRAPH_RESOLVE_ROOT,
  REALISTIC_RESOLVE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildRealisticGraphResolveRootScenario(): BenchScenario {
  const { injector, resolvedRootProvider } = buildInjectionJsRealisticInjector(REALISTIC_GRAPH);
  injector.instantiateResolved(resolvedRootProvider);

  return {
    ...REALISTIC_GRAPH_RESOLVE_ROOT,
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => sanityCheckInjectionJsRealisticTransientRoot(REALISTIC_GRAPH),
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        injector.instantiateResolved(resolvedRootProvider);
      }),
  };
}

function buildRealisticGraphColdResolveScenario(): BenchScenario {
  return {
    ...REALISTIC_GRAPH_COLD_RESOLVE,
    batch: 1,
    sanity: () => sanityCheckInjectionJsRealisticColdResolve(REALISTIC_GRAPH),
    build: () => {
      return () => {
        const { injector, rootToken } = buildInjectionJsRealisticInjector(REALISTIC_GRAPH);
        injector.get(rootToken);
      };
    },
  };
}

/**
 * Builds the injection-js realistic-graph scenarios it can express.
 */
export function buildInjectionJsRealisticScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRealisticGraphResolveRootScenario(), buildRealisticGraphColdResolveScenario()];
}
