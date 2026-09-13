/**
 * tsyringe — teardown at a scale where enumeration shows up. Parallel to
 * `../codefast/dispose-scale.ts`: a hundred `Disposable` singleton classes materialised, then
 * `dispose()`, which calls each instance's `dispose()` synchronously.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer, injectable, Lifecycle } from "tsyringe";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  DISPOSE_SCALE_SINGLETON_COUNT,
  MATERIALIZE_100_SINGLETONS,
  UNBIND_ALL_100_SINGLETONS,
} from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

@injectable()
class DisposableService {
  disposeCallCount: number = 0;

  dispose(): void {
    this.disposeCallCount += 1;
  }
}

const disposableTokens = Array.from({ length: DISPOSE_SCALE_SINGLETON_COUNT }, (_value, index) =>
  Symbol(`bench-tsyringe-disposable-${String(index)}`),
);

const SINGLETON = { lifecycle: Lifecycle.Singleton };

function buildDisposeScaleScenario(descriptor: ScenarioDescriptor, tearDown: boolean): BenchScenario {
  function runOneCycle(): DisposableService {
    const container = tsyringeRootContainer.createChildContainer();
    for (const disposableToken of disposableTokens) {
      container.register<DisposableService>(disposableToken, { useClass: DisposableService }, SINGLETON);
    }
    let lastResolved: DisposableService | undefined;
    for (const disposableToken of disposableTokens) {
      lastResolved = container.resolve<DisposableService>(disposableToken);
    }
    if (tearDown) {
      void container.dispose();
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
    sanity: () => runOneCycle().disposeCallCount === (tearDown ? 1 : 0),
    build: () => {
      return () => {
        runOneCycle();
      };
    },
  };
}

/**
 * Builds tsyringe's teardown-at-scale scenarios.
 */
export function buildTsyringeDisposeScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildDisposeScaleScenario(
      {
        ...MATERIALIZE_100_SINGLETONS,
        what: `createChildContainer(), register ${String(DISPOSE_SCALE_SINGLETON_COUNT)} Disposable singleton classes and resolve each once — the row the teardown is read against`,
      },
      false,
    ),
    buildDisposeScaleScenario(
      {
        ...UNBIND_ALL_100_SINGLETONS,
        what: `the same container, then dispose() — ${String(DISPOSE_SCALE_SINGLETON_COUNT)} instance dispose() calls`,
      },
      true,
    ),
  ];
}
