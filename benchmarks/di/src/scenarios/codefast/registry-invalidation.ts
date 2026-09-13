/**
 * `@codefast/di` — a rebind read from the far end of a container chain.
 *
 * `rebind-hot-swap` rebinds and resolves on one container, where the lookup cache has one version to
 * compare. A child's cache is stamped with the summed versions of every registry up its chain, which
 * is what lets a parent's rebind invalidate a grandchild's memo at all — and what a single-container
 * row cannot exercise. This one rebinds in the root and resolves from depth 3, so every iteration
 * throws away the whole chain's cached lookup.
 */
import { Container, token } from "@codefast/di";

import {
  CHAIN_REBIND_BATCH,
  CHAIN_REBIND_DEPTH,
  REBIND_PARENT_RESOLVE_CHILD_DEPTH_3,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildChainRebindInvalidationScenario(): BenchScenario {
  const swappedToken = token<number>("bench-cf-chain-rebind");
  const root = Container.create();

  root.bind(swappedToken).toConstantValue(0);

  let descendant = root;
  for (let depth = 0; depth < CHAIN_REBIND_DEPTH; depth++) {
    descendant = descendant.createChild();
  }

  function runOneSwap(iteration: number): number {
    root.rebind(swappedToken).toConstantValue(iteration);

    return descendant.resolve(swappedToken);
  }

  runOneSwap(0);

  return {
    ...REBIND_PARENT_RESOLVE_CHILD_DEPTH_3,
    batch: CHAIN_REBIND_BATCH,
    // The value has to arrive from the root: a descendant that owned the token would never walk.
    sanity: () => !descendant.hasOwn(swappedToken) && runOneSwap(99) === 99,
    build: () => {
      let iteration = 0;

      return batched(CHAIN_REBIND_BATCH, () => {
        runOneSwap(iteration++);
      });
    },
  };
}

/**
 * @since 0.6.0
 */
export function buildCodefastRegistryInvalidationScenarios(): ReadonlyArray<BenchScenario> {
  return [buildChainRebindInvalidationScenario()];
}
