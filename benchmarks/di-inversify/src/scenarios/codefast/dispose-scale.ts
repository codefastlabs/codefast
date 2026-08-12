/**
 * @codefast/di — teardown at a scale where enumeration shows up (codefast-only).
 *
 * `lifecycle-pre-destroy-unbind` tears down one singleton, so it prices the deactivation call and
 * nothing about finding what to deactivate. A singleton's instance lives on its binding, and the
 * scope manager keeps only a list of the bindings that have materialized — a shape whose cost is in
 * walking it, which one instance cannot show. These two rows differ by exactly that walk:
 *
 *   materialize-100-singletons    create, bind 100, resolve all 100
 *   unbind-all-100-singletons     the same, then unbindAll() — 100 @preDestroy calls
 */
import { Container, preDestroy, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

const SINGLETON_COUNT = 100;

class DisposableService {
  preDestroyCallCount: number = 0;

  @preDestroy()
  cleanUp(): void {
    this.preDestroyCallCount += 1;
  }
}

const disposableTokens = Array.from({ length: SINGLETON_COUNT }, (_value, index) =>
  token<DisposableService>(`bench-cf-disposable-${String(index)}`),
);

const MATERIALIZE_SINGLETONS = {
  id: `materialize-${String(SINGLETON_COUNT)}-singletons`,
  group: "lifecycle",
  what: `create a container, bind ${String(SINGLETON_COUNT)} singletons with @preDestroy and resolve each once — the row the teardown is read against (codefast-only)`,
} as const satisfies ScenarioDescriptor;

const UNBIND_ALL_SINGLETONS = {
  id: `unbind-all-${String(SINGLETON_COUNT)}-singletons`,
  group: "lifecycle",
  what: `the same container, then unbindAll() — the materialized-binding walk plus ${String(SINGLETON_COUNT)} @preDestroy calls (codefast-only)`,
} as const satisfies ScenarioDescriptor;

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

export function buildCodefastDisposeScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildDisposeScaleScenario(MATERIALIZE_SINGLETONS, false),
    buildDisposeScaleScenario(UNBIND_ALL_SINGLETONS, true),
  ];
}
