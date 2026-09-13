/**
 * Ditox — registry operation scenarios: a value rebound in place and re-resolved, the same rebind
 * read from the far end of a container chain, and `hasToken()` on a bound token.
 */
import { createContainer, token } from "ditox";

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

const SWAPPED = token<number>("bench-ditox-ro-rebind");
const CHAIN_SWAPPED = token<number>("bench-ditox-chain-rebind");
const BOUND = token<number>("bench-ditox-ro-has-bound");

function buildRebindHotSwapScenario(): BenchScenario {
  const container = createContainer();
  container.bindValue(SWAPPED, 1);

  function runOneSwap(iteration: number): number {
    container.bindValue(SWAPPED, iteration);
    return container.resolve(SWAPPED);
  }

  runOneSwap(0);

  return {
    ...REBIND_HOT_SWAP,
    what: "bindValue() the same token again, replacing the binding, then resolve once",
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
  root.bindValue(CHAIN_SWAPPED, 0);
  let descendant = root;
  for (let depth = 0; depth < CHAIN_REBIND_DEPTH; depth++) {
    descendant = createContainer(descendant);
  }

  function runOneSwap(iteration: number): number {
    root.bindValue(CHAIN_SWAPPED, iteration);
    return descendant.resolve(CHAIN_SWAPPED);
  }

  runOneSwap(0);

  return {
    ...REBIND_PARENT_RESOLVE_CHILD_DEPTH_3,
    what: `bindValue() again in the root, then resolve from a depth-${String(CHAIN_REBIND_DEPTH)} child — the parent chain read through per iteration`,
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
  container.bindValue(BOUND, 1);
  container.hasToken(BOUND);

  return {
    ...HAS_BOUND_CHECK,
    what: "hasToken(token) returning true — registry lookup hot path for optional-dep guards",
    batch: HAS_BOUND_BATCH,
    sanity: () => container.hasToken(BOUND),
    build: () =>
      batched(HAS_BOUND_BATCH, () => {
        container.hasToken(BOUND);
      }),
  };
}

/**
 * Builds ditox's registry operation scenarios.
 */
export function buildDitoxRegistryOpsScenarios(): ReadonlyArray<BenchScenario> {
  return [buildRebindHotSwapScenario(), buildChainRebindInvalidationScenario(), buildHasBoundCheckScenario()];
}
