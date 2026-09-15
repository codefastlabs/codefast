/**
 * Brandi — realistic-graph scenarios. Consumes the shared descriptor through
 * the brandi adapter so the same shape of work appears on every side of the
 * N-way table. Mirrors `../codefast/realistic.ts`.
 */
import { buildBrandiRealisticContainer, sanityCheckBrandiRealisticResolve } from "#/fixtures/brandi-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_COLD_RESOLVE,
  REALISTIC_GRAPH_RESOLVE_ROOT,
  REALISTIC_RESOLVE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildRealisticGraphResolveRootScenario(): BenchScenario {
  const { container, rootToken } = buildBrandiRealisticContainer(REALISTIC_GRAPH);
  container.get(rootToken);

  return {
    ...REALISTIC_GRAPH_RESOLVE_ROOT,
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => sanityCheckBrandiRealisticResolve(REALISTIC_GRAPH),
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.get(rootToken);
      }),
  };
}

function buildRealisticGraphColdResolveScenario(): BenchScenario {
  return {
    ...REALISTIC_GRAPH_COLD_RESOLVE,
    batch: 1,
    sanity: () => sanityCheckBrandiRealisticResolve(REALISTIC_GRAPH),
    build: () => {
      return () => {
        const { container, rootToken } = buildBrandiRealisticContainer(REALISTIC_GRAPH);
        container.get(rootToken);
      };
    },
  };
}

/**
 * Builds the brandi realistic-graph scenarios.
 *
 * @since 0.8.0
 */
export function buildBrandiRealisticScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRealisticGraphResolveRootScenario(), buildRealisticGraphColdResolveScenario()];
}
