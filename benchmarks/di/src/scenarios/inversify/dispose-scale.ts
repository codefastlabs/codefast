/**
 * InversifyJS 8 — teardown at a scale where enumeration shows up. Parallel to
 * `../codefast/dispose-scale.ts`: a hundred `@preDestroy` singletons materialised, then `unbindAll()`.
 */
import "reflect-metadata";
import { Container, injectable, preDestroy } from "inversify";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  DISPOSE_SCALE_SINGLETON_COUNT,
  MATERIALIZE_100_SINGLETONS,
  UNBIND_ALL_100_SINGLETONS,
} from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

@injectable()
class DisposableService {
  preDestroyCallCount: number = 0;

  // @ts-ignore reflect-metadata + explicit token injection
  @preDestroy()
  cleanUp(): void {
    this.preDestroyCallCount += 1;
  }
}

const disposableIdentifiers = Array.from({ length: DISPOSE_SCALE_SINGLETON_COUNT }, (_value, index) =>
  Symbol(`bench-inv-disposable-${String(index)}`),
);

function buildDisposeScaleScenario(descriptor: ScenarioDescriptor, tearDown: boolean): BenchScenario {
  function runOneCycle(): DisposableService {
    const container = new Container({ jitless: false });
    for (const identifier of disposableIdentifiers) {
      container.bind<DisposableService>(identifier).to(DisposableService).inSingletonScope();
    }
    let lastResolved: DisposableService | undefined;
    for (const identifier of disposableIdentifiers) {
      lastResolved = container.get<DisposableService>(identifier);
    }
    if (tearDown) {
      container.unbindAll();
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
    sanity: () => runOneCycle().preDestroyCallCount === (tearDown ? 1 : 0),
    build: () => {
      return () => {
        runOneCycle();
      };
    },
  };
}

/**
 * Builds inversify's teardown-at-scale scenarios.
 */
export function buildInversifyDisposeScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildDisposeScaleScenario(
      {
        ...MATERIALIZE_100_SINGLETONS,
        what: `new Container(), bind ${String(DISPOSE_SCALE_SINGLETON_COUNT)} @preDestroy singletons and get() each once — the row the teardown is read against`,
      },
      false,
    ),
    buildDisposeScaleScenario(
      {
        ...UNBIND_ALL_100_SINGLETONS,
        what: `the same container, then unbindAll() — ${String(DISPOSE_SCALE_SINGLETON_COUNT)} @preDestroy calls`,
      },
      true,
    ),
  ];
}
