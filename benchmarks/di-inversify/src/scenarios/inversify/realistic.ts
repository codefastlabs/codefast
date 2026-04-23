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
import type { BenchScenario } from "../types";
import { batched } from "../../harness/batched";
import {
  buildInversifyRealisticContainer,
  sanityCheckInversifyRealisticResolve,
} from "../../fixtures/inversify-adapter";
import { REALISTIC_GRAPH } from "../../fixtures/realistic-graph";

const REALISTIC_RESOLVE_BATCH = 20;

function buildRealisticGraphResolveRootScenario(): BenchScenario {
  const { container, rootIdentifier } = buildInversifyRealisticContainer(REALISTIC_GRAPH);
  container.get(rootIdentifier);

  return {
    id: "realistic-graph-resolve-root",
    group: "realistic",
    what: "resolve the transient root of a 10-node graph (hot path, singletons cached)",
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
    id: "realistic-graph-cold-resolve",
    group: "realistic",
    what: "build a fresh container, bind 10 nodes, resolve root once (cold start)",
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

export function buildInversifyRealisticScenarios(): readonly BenchScenario[] {
  return [buildRealisticGraphResolveRootScenario(), buildRealisticGraphColdResolveScenario()];
}
