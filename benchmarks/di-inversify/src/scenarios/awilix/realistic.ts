/**
 * Awilix — realistic-graph scenarios. Consumes the shared descriptor through
 * the awilix adapter so the same shape of work appears on every side of the
 * N-way table. Mirrors {@link ../codefast/realistic.ts}.
 */
import { buildAwilixRealisticContainer, sanityCheckAwilixRealisticResolve } from "#/fixtures/awilix-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_COLD_RESOLVE,
  REALISTIC_GRAPH_RESOLVE_ROOT,
  REALISTIC_RESOLVE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildRealisticGraphResolveRootScenario(): BenchScenario {
  const { container, rootName } = buildAwilixRealisticContainer(REALISTIC_GRAPH);
  container.resolve(rootName);

  return {
    ...REALISTIC_GRAPH_RESOLVE_ROOT,
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => sanityCheckAwilixRealisticResolve(REALISTIC_GRAPH),
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.resolve(rootName);
      }),
  };
}

function buildRealisticGraphColdResolveScenario(): BenchScenario {
  return {
    ...REALISTIC_GRAPH_COLD_RESOLVE,
    batch: 1,
    sanity: () => sanityCheckAwilixRealisticResolve(REALISTIC_GRAPH),
    build: () => {
      return () => {
        const { container, rootName } = buildAwilixRealisticContainer(REALISTIC_GRAPH);
        container.resolve(rootName);
      };
    },
  };
}

export function buildAwilixRealisticScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRealisticGraphResolveRootScenario(), buildRealisticGraphColdResolveScenario()];
}
