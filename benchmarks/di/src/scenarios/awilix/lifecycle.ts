/**
 * Awilix — lifecycle/disposal scenario. Parallel to `../codefast/lifecycle.ts`'s
 * `lifecycle-pre-destroy-unbind`: a singleton with a `disposer()` is materialised then torn down by
 * `dispose()`, which runs the disposer on the microtask queue and settles a promise — so the row awaits.
 */
import { asFunction, createContainer } from "awilix";

import { LIFECYCLE_PRE_DESTROY_UNBIND } from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

interface DisposableService {
  disposeCallCount: number;
}

function buildLifecyclePreDestroyUnbindScenario(): AsyncBenchScenario {
  async function runOneUnbindCycle(): Promise<void> {
    const container = createContainer();
    container.register({
      disposable: asFunction((): DisposableService => ({ disposeCallCount: 0 }))
        .singleton()
        .disposer((service) => {
          service.disposeCallCount += 1;
        }),
    });
    const instance = container.resolve<DisposableService>("disposable");
    await container.dispose();
    if (instance.disposeCallCount !== 1) {
      throw new Error("Expected the awilix disposer to run exactly once during dispose()");
    }
  }

  return {
    ...LIFECYCLE_PRE_DESTROY_UNBIND,
    what: "singleton asFunction().disposer() → resolve → await dispose() runs the teardown hook once",
    kind: "async",
    batch: 1,
    sanity: async () => {
      await runOneUnbindCycle();
      return true;
    },
    build: () => {
      return async () => {
        await runOneUnbindCycle();
      };
    },
  };
}

/**
 * Builds Awilix's lifecycle/disposal scenarios.
 *
 * @since 0.8.0
 */
export function buildAwilixLifecycleScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [buildLifecyclePreDestroyUnbindScenario()];
}
