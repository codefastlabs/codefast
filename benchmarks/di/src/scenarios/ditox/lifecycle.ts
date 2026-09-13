/**
 * ditox — lifecycle/disposal scenario. Parallel to `../codefast/lifecycle.ts`'s
 * `lifecycle-pre-destroy-unbind`: a singleton with a teardown hook is materialized
 * then torn down, running the hook once. ditox's teardown hook is the `onRemoved`
 * factory option, fired synchronously by `container.remove()`.
 */
import { createContainer, token } from "ditox";

import { LIFECYCLE_PRE_DESTROY_UNBIND } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

interface DisposableService {
  readonly value: number;
}

const disposableServiceToken = token<DisposableService>("bench-ditox-lifecycle-disposable");

function buildLifecyclePreDestroyUnbindScenario(): BenchScenario {
  function runOneUnbindCycle(): void {
    const container = createContainer();
    let onRemovedCallCount = 0;
    container.bindFactory(disposableServiceToken, () => ({ value: 1 }), {
      scope: "singleton",
      onRemoved: () => {
        onRemovedCallCount += 1;
      },
    });
    container.resolve(disposableServiceToken);
    container.remove(disposableServiceToken);
    if (onRemovedCallCount !== 1) {
      throw new Error("Expected ditox onRemoved to run exactly once during remove");
    }
  }

  // Pre-warm
  runOneUnbindCycle();

  return {
    ...LIFECYCLE_PRE_DESTROY_UNBIND,
    what: "singleton bindFactory with onRemoved → resolve → remove() runs the teardown hook once",
    batch: 1,
    sanity: () => {
      runOneUnbindCycle();
      return true;
    },
    build: () => {
      return () => {
        runOneUnbindCycle();
      };
    },
  };
}

/**
 * Builds ditox's lifecycle/disposal scenarios.
 *
 * @since 0.8.0
 */
export function buildDitoxLifecycleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildLifecyclePreDestroyUnbindScenario()];
}
