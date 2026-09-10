/**
 * tsyringe — scope benchmark. Parallel to `../codefast/scope.ts`'s
 * `scoped-binding-per-child`: a `ContainerScoped` class is shared within one child
 * container and fresh across children. The registration lives once on the app
 * container; each request only creates a fresh child — the same "bind once" shape as
 * di's `.scoped()`. `ContainerScoped` requires a class provider, not a factory.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer, injectable, Lifecycle } from "tsyringe";

import { SCOPED_BINDING_PER_CHILD, SCOPED_PER_CHILD_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

let instanceCounter = 0;

@injectable()
class ScopedInstance {
  readonly id = ++instanceCounter;
}

function buildScopedBindingPerChildScenario(): BenchScenario {
  const appContainer = tsyringeRootContainer.createChildContainer();
  appContainer.register(ScopedInstance, { useClass: ScopedInstance }, { lifecycle: Lifecycle.ContainerScoped });

  function runOneScopedRequest(): ScopedInstance {
    const child = appContainer.createChildContainer();
    const first = child.resolve(ScopedInstance);
    const second = child.resolve(ScopedInstance);
    if (first !== second) {
      throw new Error("Expected ContainerScoped class to return same instance within child");
    }
    return first;
  }

  // Pre-warm
  runOneScopedRequest();

  return {
    ...SCOPED_BINDING_PER_CHILD,
    what: "createChildContainer() + ContainerScoped class — tsyringe's per-container lifetime (bind once)",
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
 * Builds tsyringe's scope benchmark scenarios.
 */
export function buildTsyringeScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [buildScopedBindingPerChildScenario()];
}
