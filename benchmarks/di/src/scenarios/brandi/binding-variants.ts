/**
 * Brandi — the explicit-deps rows: a function creator wired with `injected()` over three constant
 * tokens, and the realistic graph built the same way.
 */
import { createContainer, injected, token } from "brandi";

import { buildBrandiRealisticInjectedContainer } from "#/fixtures/brandi-adapter";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_RESOLVED_ROOT,
  REALISTIC_RESOLVE_BATCH,
  TO_RESOLVED_3_DEPS,
  TO_RESOLVED_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface ResolvedDep {
  readonly id: string;
}

interface ResolvedService {
  readonly a: ResolvedDep;
  readonly b: ResolvedDep;
  readonly c: ResolvedDep;
}

const DEP_A = token<ResolvedDep>("bench-brandi-bv-dep-a");
const DEP_B = token<ResolvedDep>("bench-brandi-bv-dep-b");
const DEP_C = token<ResolvedDep>("bench-brandi-bv-dep-c");
const RESOLVED_SERVICE = token<ResolvedService>("bench-brandi-bv-resolved-service");

function createResolvedService(a: ResolvedDep, b: ResolvedDep, c: ResolvedDep): ResolvedService {
  return { a, b, c };
}
injected(createResolvedService, DEP_A, DEP_B, DEP_C);

function buildToResolvedThreeDepsScenario(): BenchScenario {
  const container = createContainer();
  container.bind(DEP_A).toConstant({ id: "a" });
  container.bind(DEP_B).toConstant({ id: "b" });
  container.bind(DEP_C).toConstant({ id: "c" });
  container.bind(RESOLVED_SERVICE).toInstance(createResolvedService).inSingletonScope();
  const prewarmed = container.get(RESOLVED_SERVICE);

  return {
    ...TO_RESOLVED_3_DEPS,
    what: "get() a singleton function creator wired with injected() over 3 dependency tokens (cache hit)",
    batch: TO_RESOLVED_BATCH,
    sanity: () => {
      const result = container.get(RESOLVED_SERVICE);
      return result === prewarmed && result.a.id === "a" && result.b.id === "b";
    },
    build: () =>
      batched(TO_RESOLVED_BATCH, () => {
        container.get(RESOLVED_SERVICE);
      }),
  };
}

function buildRealisticGraphResolvedRootScenario(): BenchScenario {
  const { container, rootToken } = buildBrandiRealisticInjectedContainer(REALISTIC_GRAPH);
  container.get(rootToken);

  return {
    ...REALISTIC_GRAPH_RESOLVED_ROOT,
    what: "get() the transient root of the 10-node graph bound as injected() function creators (brandi's explicit-deps form)",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => {
      const resolved = container.get(rootToken);
      return resolved.__id === REALISTIC_GRAPH.rootId && resolved.resolvedDependencies.length === 3;
    },
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.get(rootToken);
      }),
  };
}

/**
 * Builds brandi's explicit-deps scenarios.
 *
 * @since 0.8.0
 */
export function buildBrandiBindingVariantScenarios(): ReadonlyArray<BenchScenario> {
  return [buildToResolvedThreeDepsScenario(), buildRealisticGraphResolvedRootScenario()];
}
