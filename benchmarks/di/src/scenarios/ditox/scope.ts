/**
 * ditox — scope benchmarks. Parallel to `../codefast/scope.ts`.
 *
 *   - `child-depth-2-resolve`: a root binds a constant, and a depth-2 child resolves
 *     it by walking the parent chain — aligns against every library with real
 *     container hierarchy (di, inversify, injection-js).
 *
 *   - `scoped-binding-per-child`: a per-request child gets a `scoped` factory whose
 *     instance is shared within that child and fresh across children. ditox caches a
 *     scoped factory by its *owner* container, so the factory is bound in the child
 *     each iteration — the same "one bind per request" shape inversify uses.
 */
import { createContainer, token } from "ditox";

import {
  CHILD_DEPTH_2_RESOLVE,
  CHILD_RESOLVE_BATCH,
  SCOPED_BINDING_PER_CHILD,
  SCOPED_PER_CHILD_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const childScopeLeafToken = token<number>("bench-ditox-child2-leaf");
  const rootContainer = createContainer();
  rootContainer.bindValue(childScopeLeafToken, 42);
  const firstLevelChildContainer = createContainer(rootContainer);
  const secondLevelChildContainer = createContainer(firstLevelChildContainer);
  secondLevelChildContainer.resolve(childScopeLeafToken);

  return {
    ...CHILD_DEPTH_2_RESOLVE,
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => secondLevelChildContainer.resolve(childScopeLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        secondLevelChildContainer.resolve(childScopeLeafToken);
      }),
  };
}

interface ScopedInstance {
  readonly id: number;
}

const scopedToken = token<ScopedInstance>("bench-ditox-scoped");

function buildScopedBindingPerChildScenario(): BenchScenario {
  const rootContainer = createContainer();
  let instanceCounter = 0;

  function runOneScopedRequest(): ScopedInstance {
    const scope = createContainer(rootContainer);
    scope.bindFactory(scopedToken, () => ({ id: ++instanceCounter }), { scope: "scoped" });
    const first = scope.resolve(scopedToken);
    const second = scope.resolve(scopedToken);
    if (first !== second) {
      throw new Error("Expected scoped binding to return same instance within child");
    }
    scope.removeAll();
    return first;
  }

  // Pre-warm
  runOneScopedRequest();

  return {
    ...SCOPED_BINDING_PER_CHILD,
    what: "per-request child + scoped bindFactory — ditox caches scoped by owner, so one bind per iteration",
    batch: SCOPED_PER_CHILD_BATCH,
    sanity: () => {
      const first = runOneScopedRequest();
      const second = runOneScopedRequest();
      return first !== second && first.id < second.id;
    },
    build: () =>
      batched(SCOPED_PER_CHILD_BATCH, () => {
        runOneScopedRequest();
      }),
  };
}

/**
 * Builds ditox's scope benchmark scenarios.
 */
export function buildDitoxScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [buildChildDepthTwoResolveScenario(), buildScopedBindingPerChildScenario()];
}
