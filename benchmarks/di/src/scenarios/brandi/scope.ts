/**
 * Brandi — scope benchmark. Parallel to `../codefast/scope.ts`'s
 * `scoped-binding-per-child`: an `inContainerScope` binding is shared within one
 * container and fresh across containers. The binding lives once on the app module;
 * each request creates a fresh child that `extend`s the app — the same "bind once"
 * shape as di's `.scoped()`. Brandi has no container disposal, so there is no
 * per-request teardown step.
 */
import { createContainer, token } from "brandi";

import { SCOPED_BINDING_PER_CHILD, SCOPED_PER_CHILD_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface ScopedInstance {
  readonly id: number;
}

let instanceCounter = 0;

class ScopedInstanceImpl implements ScopedInstance {
  readonly id = ++instanceCounter;
}

const scopedToken = token<ScopedInstance>("bench-brandi-scoped");

function buildScopedBindingPerChildScenario(): BenchScenario {
  const appContainer = createContainer();
  appContainer.bind(scopedToken).toInstance(ScopedInstanceImpl).inContainerScope();

  function runOneScopedRequest(): ScopedInstance {
    const scope = createContainer();
    scope.extend(appContainer);
    const first = scope.get(scopedToken);
    const second = scope.get(scopedToken);
    if (first !== second) {
      throw new Error("Expected inContainerScope binding to return same instance within scope");
    }
    return first;
  }

  // Pre-warm
  runOneScopedRequest();

  return {
    ...SCOPED_BINDING_PER_CHILD,
    what: "child createContainer().extend(app) + inContainerScope — brandi's per-container lifetime (bind once)",
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
 * Builds brandi's scope benchmark scenarios.
 */
export function buildBrandiScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [buildScopedBindingPerChildScenario()];
}
