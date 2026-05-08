/**
 * @codefast/di — realistic-graph scenarios. These are the *headline*
 * comparison rows: they consume the shared descriptor and wire it through
 * codefast's own factory-binding API, so the same shape of work appears
 * on both sides of the table.
 *
 * Two head-to-head variants here:
 *   - `realistic-graph-resolve-root` — build once, resolve root hot. The
 *     root is transient, so singletons cache but the top-level factory
 *     chain fires each call; measures steady-state per-request cost.
 *   - `realistic-graph-cold-resolve` — build a fresh container + 10 binds
 *     + resolve root per iteration. Measures cold-start; catches regressions
 *     in registry mutation + first-resolve code paths.
 */
import {
  buildCodefastRealisticContainer,
  sanityCheckCodefastRealisticResolve,
} from "#/fixtures/codefast-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const REALISTIC_RESOLVE_BATCH = 20;

function buildRealisticGraphResolveRootScenario(): BenchScenario {
  const { container, rootToken } = buildCodefastRealisticContainer(REALISTIC_GRAPH);
  // Pre-warm: caches every singleton; first measured sample then only pays
  // for the top-level transient factory + cache hits underneath.
  container.resolve(rootToken);

  return {
    id: "realistic-graph-resolve-root",
    group: "realistic",
    what: "resolve the transient root of a 10-node graph (hot path, singletons cached)",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => sanityCheckCodefastRealisticResolve(REALISTIC_GRAPH),
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.resolve(rootToken);
      }),
  };
}

function buildRealisticGraphColdResolveScenario(): BenchScenario {
  return {
    id: "realistic-graph-cold-resolve",
    group: "realistic",
    what: "build a fresh container, bind 10 nodes, resolve root once (cold start)",
    batch: 1,
    sanity: () => sanityCheckCodefastRealisticResolve(REALISTIC_GRAPH),
    build: () => {
      return () => {
        const { container, rootToken } = buildCodefastRealisticContainer(REALISTIC_GRAPH);
        container.resolve(rootToken);
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastRealisticScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRealisticGraphResolveRootScenario(), buildRealisticGraphColdResolveScenario()];
}
