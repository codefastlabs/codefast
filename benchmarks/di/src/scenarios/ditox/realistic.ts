/**
 * Ditox — realistic-graph scenarios. Consumes the shared descriptor through the
 * ditox adapter so the same shape of work appears on every side of the N-way
 * table. Mirrors `../codefast/realistic.ts`.
 */
import { buildDitoxRealisticContainer, sanityCheckDitoxRealisticResolve } from "#/fixtures/ditox-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_COLD_RESOLVE,
  REALISTIC_GRAPH_RESOLVE_ROOT,
  REALISTIC_RESOLVE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildRealisticGraphResolveRootScenario(): BenchScenario {
  const { container, rootToken } = buildDitoxRealisticContainer(REALISTIC_GRAPH);
  container.resolve(rootToken);

  return {
    ...REALISTIC_GRAPH_RESOLVE_ROOT,
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => sanityCheckDitoxRealisticResolve(REALISTIC_GRAPH),
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.resolve(rootToken);
      }),
  };
}

function buildRealisticGraphColdResolveScenario(): BenchScenario {
  return {
    ...REALISTIC_GRAPH_COLD_RESOLVE,
    batch: 1,
    sanity: () => sanityCheckDitoxRealisticResolve(REALISTIC_GRAPH),
    build: () => {
      return () => {
        const { container, rootToken } = buildDitoxRealisticContainer(REALISTIC_GRAPH);
        container.resolve(rootToken);
      };
    },
  };
}

/**
 * Builds the ditox realistic-graph scenarios.
 */
export function buildDitoxRealisticScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRealisticGraphResolveRootScenario(), buildRealisticGraphColdResolveScenario()];
}
