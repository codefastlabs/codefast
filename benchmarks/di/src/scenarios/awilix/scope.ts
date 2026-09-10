/**
 * Awilix — scope benchmark. Parallel to `../codefast/scope.ts`'s
 * `scoped-binding-per-child`: a `scoped`-lifetime registration is shared within one
 * `createScope()` and fresh across scopes. Awilix has a native per-scope lifetime,
 * so the registration is declared once on the root and each request only creates a
 * fresh scope — the same "bind once" shape as di's `.scoped()`.
 */
import { asFunction, createContainer } from "awilix";

import { SCOPED_BINDING_PER_CHILD, SCOPED_PER_CHILD_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface ScopedInstance {
  readonly id: number;
}

function buildScopedBindingPerChildScenario(): BenchScenario {
  let instanceCounter = 0;
  const rootContainer = createContainer();
  rootContainer.register({
    scopedInstance: asFunction((): ScopedInstance => ({ id: ++instanceCounter })).scoped(),
  });

  function runOneScopedRequest(): ScopedInstance {
    const scope = rootContainer.createScope();
    const first = scope.resolve<ScopedInstance>("scopedInstance");
    const second = scope.resolve<ScopedInstance>("scopedInstance");
    if (first !== second) {
      throw new Error("Expected scoped registration to return same instance within scope");
    }
    return first;
  }

  // Pre-warm
  runOneScopedRequest();

  return {
    ...SCOPED_BINDING_PER_CHILD,
    what: "createScope() + asFunction().scoped() — awilix's native per-scope lifetime (bind once)",
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
 * Builds Awilix's scope benchmark scenarios.
 */
export function buildAwilixScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [buildScopedBindingPerChildScenario()];
}
