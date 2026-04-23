/**
 * @codefast/di — realistic-graph scenarios. These are the *headline*
 * comparison rows: they consume the shared descriptor and wire it through
 * codefast's own factory-binding API, so the same shape of work appears
 * on both sides of the table.
 *
 * Three variants here:
 *   - `realistic-graph-resolve-root` — build once, resolve root hot. The
 *     root is transient, so singletons cache but the top-level factory
 *     chain fires each call; measures steady-state per-request cost.
 *   - `realistic-graph-cold-resolve` — build a fresh container + 10 binds
 *     + resolve root per iteration. Measures cold-start; catches regressions
 *     in registry mutation + first-resolve code paths.
 *   - `realistic-graph-validate` (codefast-only) — call `container.validate()`
 *     hot. Inversify has no equivalent, so the reporter simply shows "—"
 *     on the inversify column. This is included because a shipping feature
 *     of codefast (static scope-rule validation) should appear in its
 *     benchmark surface even when no comparator has it yet.
 */
import {
  buildCodefastRealisticContainer,
  sanityCheckCodefastRealisticResolve,
} from "#/fixtures/codefast-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const REALISTIC_RESOLVE_BATCH = 20;
const REALISTIC_VALIDATE_BATCH = 10;

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

function buildRealisticGraphValidateScenario(): BenchScenario {
  const { container } = buildCodefastRealisticContainer(REALISTIC_GRAPH);
  // Warmup — validate memoises internally via `devValidationState`; we want
  // to measure the path where validation re-runs because someone just
  // mutated the registry, which is the realistic dev-time story.
  container.validate();

  return {
    id: "realistic-graph-validate",
    group: "realistic",
    what: "statically validate scope rules over a 10-node graph (codefast-only)",
    batch: REALISTIC_VALIDATE_BATCH,
    sanity: () => {
      try {
        container.validate();
        return true;
      } catch {
        return false;
      }
    },
    build: () =>
      batched(REALISTIC_VALIDATE_BATCH, () => {
        container.validate();
      }),
  };
}

export function buildCodefastRealisticScenarios(): readonly BenchScenario[] {
  return [
    buildRealisticGraphResolveRootScenario(),
    buildRealisticGraphColdResolveScenario(),
    buildRealisticGraphValidateScenario(),
  ];
}
