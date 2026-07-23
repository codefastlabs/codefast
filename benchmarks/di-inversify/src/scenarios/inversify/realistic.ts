/**
 * InversifyJS 8 — realistic-graph scenarios. Parallel to
 * {@link ../codefast/realistic.ts}. The `realistic-graph-validate`
 * scenario is intentionally absent: inversify has no equivalent static
 * scope-rule validator, so forcing it to run an ad-hoc impl would
 * measure "harness-invented code" rather than the library.
 *
 * The reporter renders the missing row as "—" on the inversify column.
 */
import "reflect-metadata";
import { buildInversifyRealisticContainer, sanityCheckInversifyRealisticResolve } from "#/fixtures/inversify-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_COLD_RESOLVE,
  REALISTIC_GRAPH_RESOLVE_ROOT,
  REALISTIC_RESOLVE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildRealisticGraphResolveRootScenario(): BenchScenario {
  const { container, rootIdentifier } = buildInversifyRealisticContainer(REALISTIC_GRAPH);
  container.get(rootIdentifier);

  return {
    ...REALISTIC_GRAPH_RESOLVE_ROOT,
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => sanityCheckInversifyRealisticResolve(REALISTIC_GRAPH),
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.get(rootIdentifier);
      }),
  };
}

function buildRealisticGraphColdResolveScenario(): BenchScenario {
  return {
    ...REALISTIC_GRAPH_COLD_RESOLVE,
    batch: 1,
    sanity: () => sanityCheckInversifyRealisticResolve(REALISTIC_GRAPH),
    build: () => {
      return () => {
        const { container, rootIdentifier } = buildInversifyRealisticContainer(REALISTIC_GRAPH);
        container.get(rootIdentifier);
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyRealisticScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRealisticGraphResolveRootScenario(), buildRealisticGraphColdResolveScenario()];
}
