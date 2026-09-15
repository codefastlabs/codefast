/**
 * Ditox — teardown at a scale where enumeration shows up. Parallel to `../codefast/dispose-scale.ts`:
 * a hundred singleton factories with `onRemoved`, then `removeAll()`.
 */
import { createContainer, token } from "ditox";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  DISPOSE_SCALE_SINGLETON_COUNT,
  MATERIALIZE_100_SINGLETONS,
  UNBIND_ALL_100_SINGLETONS,
} from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

interface DisposableService {
  removedCallCount: number;
}

const disposableTokens = Array.from({ length: DISPOSE_SCALE_SINGLETON_COUNT }, (_value, index) =>
  token<DisposableService>(`bench-ditox-disposable-${String(index)}`),
);

function buildDisposableService(): DisposableService {
  return { removedCallCount: 0 };
}

function onRemoved(service: DisposableService): void {
  service.removedCallCount += 1;
}

const SINGLETON_WITH_TEARDOWN = { scope: "singleton", onRemoved } as const;

function buildDisposeScaleScenario(descriptor: ScenarioDescriptor, tearDown: boolean): BenchScenario {
  function runOneCycle(): DisposableService {
    const container = createContainer();
    for (const disposableToken of disposableTokens) {
      container.bindFactory(disposableToken, buildDisposableService, SINGLETON_WITH_TEARDOWN);
    }
    let lastResolved: DisposableService | undefined;
    for (const disposableToken of disposableTokens) {
      lastResolved = container.resolve(disposableToken);
    }
    if (tearDown) {
      container.removeAll();
    }
    if (lastResolved === undefined) {
      throw new Error("Expected at least one singleton to be resolved");
    }
    return lastResolved;
  }

  runOneCycle();

  return {
    ...descriptor,
    batch: 1,
    sanity: () => runOneCycle().removedCallCount === (tearDown ? 1 : 0),
    build: () => {
      return () => {
        runOneCycle();
      };
    },
  };
}

/**
 * Builds ditox's teardown-at-scale scenarios.
 *
 * @since 0.8.0
 */
export function buildDitoxDisposeScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildDisposeScaleScenario(
      {
        ...MATERIALIZE_100_SINGLETONS,
        what: `createContainer(), bindFactory ${String(DISPOSE_SCALE_SINGLETON_COUNT)} singleton tokens with onRemoved and resolve each once — the row the teardown is read against`,
      },
      false,
    ),
    buildDisposeScaleScenario(
      {
        ...UNBIND_ALL_100_SINGLETONS,
        what: `the same container, then removeAll() — ${String(DISPOSE_SCALE_SINGLETON_COUNT)} onRemoved calls`,
      },
      true,
    ),
  ];
}
