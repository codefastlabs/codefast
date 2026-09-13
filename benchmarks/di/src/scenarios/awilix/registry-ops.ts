/**
 * Awilix — registry operation scenarios: a registration replaced in place and re-resolved, the same
 * replacement read from the far end of a scope chain, and `hasRegistration()` on a bound name.
 */
import { asValue, createContainer } from "awilix";

import {
  CHAIN_REBIND_BATCH,
  CHAIN_REBIND_DEPTH,
  HAS_BOUND_BATCH,
  HAS_BOUND_CHECK,
  REBIND_BATCH,
  REBIND_HOT_SWAP,
  REBIND_PARENT_RESOLVE_CHILD_DEPTH_3,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildRebindHotSwapScenario(): BenchScenario {
  const container = createContainer();
  container.register({ swapped: asValue(1) });

  function runOneSwap(iteration: number): number {
    container.register({ swapped: asValue(iteration) });
    return container.resolve<number>("swapped");
  }

  runOneSwap(0);

  return {
    ...REBIND_HOT_SWAP,
    what: "register() the same name again with asValue(), replacing the registration, then resolve once",
    batch: REBIND_BATCH,
    sanity: () => runOneSwap(99) === 99,
    build: () => {
      let iteration = 0;
      return batched(REBIND_BATCH, () => {
        runOneSwap(iteration++);
      });
    },
  };
}

function buildChainRebindInvalidationScenario(): BenchScenario {
  const root = createContainer();
  root.register({ swapped: asValue(0) });
  let descendant = root;
  for (let depth = 0; depth < CHAIN_REBIND_DEPTH; depth++) {
    descendant = descendant.createScope();
  }

  function runOneSwap(iteration: number): number {
    root.register({ swapped: asValue(iteration) });
    return descendant.resolve<number>("swapped");
  }

  runOneSwap(0);

  return {
    ...REBIND_PARENT_RESOLVE_CHILD_DEPTH_3,
    what: `register() again in the root, then resolve from a depth-${String(CHAIN_REBIND_DEPTH)} scope — the scope chain read through per iteration`,
    batch: CHAIN_REBIND_BATCH,
    sanity: () => runOneSwap(99) === 99,
    build: () => {
      let iteration = 0;
      return batched(CHAIN_REBIND_BATCH, () => {
        runOneSwap(iteration++);
      });
    },
  };
}

function buildHasBoundCheckScenario(): BenchScenario {
  const container = createContainer();
  container.register({ bound: asValue(1) });
  container.hasRegistration("bound");

  return {
    ...HAS_BOUND_CHECK,
    what: "hasRegistration(name) returning true — registry lookup hot path for optional-dep guards",
    batch: HAS_BOUND_BATCH,
    sanity: () => container.hasRegistration("bound"),
    build: () =>
      batched(HAS_BOUND_BATCH, () => {
        container.hasRegistration("bound");
      }),
  };
}

/**
 * Builds Awilix's registry operation scenarios.
 */
export function buildAwilixRegistryOpsScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRebindHotSwapScenario(), buildChainRebindInvalidationScenario(), buildHasBoundCheckScenario()];
}
