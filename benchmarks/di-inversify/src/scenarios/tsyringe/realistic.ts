/**
 * tsyringe — realistic-graph scenarios. Consumes the shared descriptor through
 * the tsyringe adapter so the same shape of work appears on every side of the
 * N-way table. Mirrors {@link ../codefast/realistic.ts}.
 */
import "reflect-metadata";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_COLD_RESOLVE,
  REALISTIC_GRAPH_RESOLVE_ROOT,
  REALISTIC_RESOLVE_BATCH,
} from "#/fixtures/scenario-parity";
import { buildTsyringeRealisticContainer, sanityCheckTsyringeRealisticResolve } from "#/fixtures/tsyringe-adapter";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildRealisticGraphResolveRootScenario(): BenchScenario {
  const { container, rootToken } = buildTsyringeRealisticContainer(REALISTIC_GRAPH);
  container.resolve(rootToken);

  return {
    ...REALISTIC_GRAPH_RESOLVE_ROOT,
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => sanityCheckTsyringeRealisticResolve(REALISTIC_GRAPH),
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
    sanity: () => sanityCheckTsyringeRealisticResolve(REALISTIC_GRAPH),
    build: () => {
      return () => {
        const { container, rootToken } = buildTsyringeRealisticContainer(REALISTIC_GRAPH);
        container.resolve(rootToken);
      };
    },
  };
}

export function buildTsyringeRealisticScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRealisticGraphResolveRootScenario(), buildRealisticGraphColdResolveScenario()];
}
