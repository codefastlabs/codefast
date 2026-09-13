/**
 * Awilix — teardown at a scale where enumeration shows up. Parallel to `../codefast/dispose-scale.ts`:
 * a hundred singletons with a `disposer()`, then `dispose()`. Awilix runs disposers on the microtask
 * queue and settles a promise, so both rows of the pair are awaited to stay subtractable.
 */
import type { AwilixContainer } from "awilix";
import { asFunction, createContainer } from "awilix";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  DISPOSE_SCALE_SINGLETON_COUNT,
  MATERIALIZE_100_SINGLETONS,
  UNBIND_ALL_100_SINGLETONS,
} from "#/fixtures/scenario-parity";
import type { AsyncBenchScenario } from "#/scenarios/types";

interface DisposableService {
  disposeCallCount: number;
}

const disposableNames = Array.from(
  { length: DISPOSE_SCALE_SINGLETON_COUNT },
  (_value, index) => `disposable${String(index)}`,
);

function buildDisposableService(): DisposableService {
  return { disposeCallCount: 0 };
}

function disposeService(service: DisposableService): void {
  service.disposeCallCount += 1;
}

function buildDisposeScaleScenario(descriptor: ScenarioDescriptor, tearDown: boolean): AsyncBenchScenario {
  async function runOneCycle(): Promise<DisposableService> {
    const container: AwilixContainer = createContainer();
    for (const name of disposableNames) {
      container.register(name, asFunction(buildDisposableService).singleton().disposer(disposeService));
    }
    let lastResolved: DisposableService | undefined;
    for (const name of disposableNames) {
      lastResolved = container.resolve<DisposableService>(name);
    }
    if (tearDown) {
      await container.dispose();
    }
    if (lastResolved === undefined) {
      throw new Error("Expected at least one singleton to be resolved");
    }
    return lastResolved;
  }

  return {
    ...descriptor,
    kind: "async",
    batch: 1,
    sanity: async () => (await runOneCycle()).disposeCallCount === (tearDown ? 1 : 0),
    build: () => {
      return async () => {
        await runOneCycle();
      };
    },
  };
}

/**
 * Builds Awilix's teardown-at-scale scenarios.
 */
export function buildAwilixDisposeScaleScenarios(): ReadonlyArray<AsyncBenchScenario> {
  return [
    buildDisposeScaleScenario(
      {
        ...MATERIALIZE_100_SINGLETONS,
        what: `createContainer(), register ${String(DISPOSE_SCALE_SINGLETON_COUNT)} singleton asFunction().disposer() names and resolve each once (awaited) — the row the teardown is read against`,
      },
      false,
    ),
    buildDisposeScaleScenario(
      {
        ...UNBIND_ALL_100_SINGLETONS,
        what: `the same container, then await dispose() — ${String(DISPOSE_SCALE_SINGLETON_COUNT)} disposers run on the microtask queue`,
      },
      true,
    ),
  ];
}
