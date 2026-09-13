/**
 * Ditox — the explicit-deps rows: an `injectable()` factory over three constant tokens, and the
 * realistic graph, whose ditox adapter is already the explicit-deps form.
 */
import { createContainer, injectable, token } from "ditox";

import { buildDitoxRealisticContainer } from "#/fixtures/ditox-adapter";
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

const DEP_A = token<ResolvedDep>("bench-ditox-bv-dep-a");
const DEP_B = token<ResolvedDep>("bench-ditox-bv-dep-b");
const DEP_C = token<ResolvedDep>("bench-ditox-bv-dep-c");
const RESOLVED_SERVICE = token<ResolvedService>("bench-ditox-bv-resolved-service");

function buildToResolvedThreeDepsScenario(): BenchScenario {
  const container = createContainer();
  container.bindValue(DEP_A, { id: "a" });
  container.bindValue(DEP_B, { id: "b" });
  container.bindValue(DEP_C, { id: "c" });
  container.bindFactory(
    RESOLVED_SERVICE,
    injectable((a: ResolvedDep, b: ResolvedDep, c: ResolvedDep): ResolvedService => ({ a, b, c }), DEP_A, DEP_B, DEP_C),
    { scope: "singleton" },
  );
  const prewarmed = container.resolve(RESOLVED_SERVICE);

  return {
    ...TO_RESOLVED_3_DEPS,
    what: "resolve a singleton injectable() factory over 3 dependency tokens (cache hit)",
    batch: TO_RESOLVED_BATCH,
    sanity: () => {
      const result = container.resolve(RESOLVED_SERVICE);
      return result === prewarmed && result.a.id === "a" && result.b.id === "b";
    },
    build: () =>
      batched(TO_RESOLVED_BATCH, () => {
        container.resolve(RESOLVED_SERVICE);
      }),
  };
}

function buildRealisticGraphResolvedRootScenario(): BenchScenario {
  const { container, rootToken } = buildDitoxRealisticContainer(REALISTIC_GRAPH);
  container.resolve(rootToken);

  return {
    ...REALISTIC_GRAPH_RESOLVED_ROOT,
    // ditox has one factory form and it declares its dependencies, so this is its resolve-root row again.
    what: "resolve the transient root of the 10-node graph bound as injectable() factories (ditox's only factory form is explicit-deps)",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: () => {
      const resolved = container.resolve(rootToken);
      return resolved.__id === REALISTIC_GRAPH.rootId && resolved.resolvedDependencies.length === 3;
    },
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.resolve(rootToken);
      }),
  };
}

/**
 * Builds ditox's explicit-deps scenarios.
 */
export function buildDitoxBindingVariantScenarios(): ReadonlyArray<BenchScenario> {
  return [buildToResolvedThreeDepsScenario(), buildRealisticGraphResolvedRootScenario()];
}
