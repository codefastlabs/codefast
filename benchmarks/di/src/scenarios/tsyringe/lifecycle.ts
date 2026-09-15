/**
 * tsyringe — lifecycle/disposal scenario. Parallel to `../codefast/lifecycle.ts`'s
 * `lifecycle-pre-destroy-unbind`: a singleton with a teardown hook is materialized
 * then torn down, running the hook once. tsyringe disposes instances implementing
 * `dispose()` when `container.dispose()` runs — sync disposers fire synchronously
 * (the returned promise only settles the async ones, of which there are none here).
 */
import "reflect-metadata";
import { container as tsyringeRootContainer, injectable, Lifecycle } from "tsyringe";

import { LIFECYCLE_PRE_DESTROY_UNBIND } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

let disposeCallCount = 0;

@injectable()
class DisposableService {
  dispose(): void {
    disposeCallCount += 1;
  }
}

function buildLifecyclePreDestroyUnbindScenario(): BenchScenario {
  function runOneUnbindCycle(): void {
    const callCountBefore = disposeCallCount;
    const child = tsyringeRootContainer.createChildContainer();
    child.register(DisposableService, { useClass: DisposableService }, { lifecycle: Lifecycle.ContainerScoped });
    child.resolve(DisposableService);
    void child.dispose();
    if (disposeCallCount !== callCountBefore + 1) {
      throw new Error("Expected tsyringe dispose() to run the disposer exactly once");
    }
  }

  // Pre-warm
  runOneUnbindCycle();

  return {
    ...LIFECYCLE_PRE_DESTROY_UNBIND,
    what: "createChildContainer() + ContainerScoped disposable → resolve → dispose() runs the teardown hook once",
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
 * Builds tsyringe's lifecycle/disposal scenarios.
 *
 * @since 0.8.0
 */
export function buildTsyringeLifecycleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildLifecyclePreDestroyUnbindScenario()];
}
