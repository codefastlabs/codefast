/**
 * `@codefast/di` — teardown at a scale where enumeration shows up.
 *
 * `lifecycle-pre-destroy-unbind` tears down one singleton, so it prices the deactivation call and
 * nothing about finding what to deactivate. A singleton's instance lives on its binding, and the
 * scope manager keeps only a list of the bindings that have materialized — a shape whose cost is in
 * walking it, which one instance cannot show. These two rows differ by exactly that walk:
 *
 *   materialize-100-singletons    create, bind 100, resolve all 100
 *   unbind-all-100-singletons     the same, then unbindAll() — 100 `@preDestroy` calls
 */
import { Container, preDestroy, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  DISPOSE_SCALE_SINGLETON_COUNT,
  MATERIALIZE_100_SINGLETONS,
  UNBIND_ALL_100_SINGLETONS,
} from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

class DisposableService {
  preDestroyCallCount: number = 0;

  @preDestroy()
  cleanUp(): void {
    this.preDestroyCallCount += 1;
  }
}

const disposableTokens = Array.from({ length: DISPOSE_SCALE_SINGLETON_COUNT }, (_value, index) =>
  token<DisposableService>(`bench-cf-disposable-${String(index)}`),
);

function buildDisposeScaleScenario(descriptor: ScenarioDescriptor, tearDown: boolean): BenchScenario {
  function runOneCycle(): DisposableService {
    const container = Container.create();

    for (const disposableToken of disposableTokens) {
      container.bind(disposableToken).to(DisposableService).singleton();
    }

    let lastResolved: DisposableService | undefined;
    for (const disposableToken of disposableTokens) {
      lastResolved = container.resolve(disposableToken);
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
    // Only the teardown row may have run @preDestroy, which is the difference the pair is here for.
    sanity: () => runOneCycle().preDestroyCallCount === (tearDown ? 1 : 0),
    build: () => {
      return () => {
        runOneCycle();
      };
    },
  };
}

/**
 * @since 0.6.0
 */
export function buildCodefastDisposeScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildDisposeScaleScenario(
      {
        ...MATERIALIZE_100_SINGLETONS,
        what: `create a container, bind ${String(DISPOSE_SCALE_SINGLETON_COUNT)} singletons with @preDestroy and resolve each once — the row the teardown is read against`,
      },
      false,
    ),
    buildDisposeScaleScenario(
      {
        ...UNBIND_ALL_100_SINGLETONS,
        what: `the same container, then unbindAll() — the materialised-binding walk plus ${String(DISPOSE_SCALE_SINGLETON_COUNT)} @preDestroy calls`,
      },
      true,
    ),
  ];
}
