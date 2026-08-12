/**
 * @codefast/di — a rebind read from the far end of a container chain (codefast-only).
 *
 * `rebind-hot-swap` rebinds and resolves on one container, where the lookup cache has one version to
 * compare. A child's cache is stamped with the summed versions of every registry up its chain, which
 * is what lets a parent's rebind invalidate a grandchild's memo at all — and what a single-container
 * row cannot exercise. This one rebinds in the root and resolves from depth 3, so every iteration
 * throws away the whole chain's cached lookup.
 */
import { Container, token } from "@codefast/di";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CHAIN_REBIND_BATCH = 50;
const CHAIN_DEPTH = 3;

const CHAIN_REBIND_INVALIDATION = {
  id: `rebind-parent-resolve-child-depth-${String(CHAIN_DEPTH)}`,
  group: "lifecycle",
  what: `rebind in the root, then resolve from a depth-${String(CHAIN_DEPTH)} child — the chain-summed version stamp invalidated per iteration (codefast-only)`,
} as const satisfies ScenarioDescriptor;

function buildChainRebindInvalidationScenario(): BenchScenario {
  const swappedToken = token<number>("bench-cf-chain-rebind");
  const root = Container.create();

  root.bind(swappedToken).toConstantValue(0);

  let descendant = root;
  for (let depth = 0; depth < CHAIN_DEPTH; depth++) {
    descendant = descendant.createChild();
  }

  function runOneSwap(iteration: number): number {
    root.rebind(swappedToken).toConstantValue(iteration);

    return descendant.resolve(swappedToken);
  }

  runOneSwap(0);

  return {
    ...CHAIN_REBIND_INVALIDATION,
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

export function buildCodefastRegistryInvalidationScenarios(): ReadonlyArray<BenchScenario> {
  return [buildChainRebindInvalidationScenario()];
}
