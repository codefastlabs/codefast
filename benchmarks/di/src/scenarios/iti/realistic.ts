/**
 * iti — realistic-graph scenario. Only the cold-resolve row is expressible:
 * iti memoizes every binding, so a fresh container resolved once matches the
 * other adapters' work, while the hot transient-root row does not.
 */
import { buildItiRealisticContainer, sanityCheckItiRealisticResolve } from "#/fixtures/iti-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import { REALISTIC_GRAPH_COLD_RESOLVE } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function buildRealisticGraphColdResolveScenario(): BenchScenario {
  return {
    ...REALISTIC_GRAPH_COLD_RESOLVE,
    batch: 1,
    sanity: () => sanityCheckItiRealisticResolve(REALISTIC_GRAPH),
    build: () => {
      return () => {
        buildItiRealisticContainer(REALISTIC_GRAPH).resolveRoot();
      };
    },
  };
}

/**
 * Builds the iti realistic-graph scenarios iti can express.
 */
export function buildItiRealisticScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRealisticGraphColdResolveScenario()];
}
