/**
 * ditox — child-scope benchmark. Parallel to `../codefast/scope.ts`'s
 * `child-depth-2-resolve`: a root binds a constant, and a depth-2 child resolves
 * it by walking `PARENT_CONTAINERS` up the chain. Same id, same batch, same
 * pre-warm, so the row aligns against every library that has real container
 * hierarchy (di, inversify, injection-js). ditox caches nothing in the child, so
 * each resolve walks the two levels — the work di and injection-js also do.
 */
import { createContainer, token } from "ditox";

import { CHILD_DEPTH_2_RESOLVE, CHILD_RESOLVE_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const childScopeLeafToken = token<number>("bench-ditox-child2-leaf");
  const rootContainer = createContainer();
  rootContainer.bindValue(childScopeLeafToken, 42);
  const firstLevelChildContainer = createContainer(rootContainer);
  const secondLevelChildContainer = createContainer(firstLevelChildContainer);
  secondLevelChildContainer.resolve(childScopeLeafToken);

  return {
    ...CHILD_DEPTH_2_RESOLVE,
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => secondLevelChildContainer.resolve(childScopeLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        secondLevelChildContainer.resolve(childScopeLeafToken);
      }),
  };
}

/**
 * Builds ditox's child-scope benchmark scenarios.
 */
export function buildDitoxScopeScenarios(): ReadonlyArray<BenchScenario> {
  return [buildChildDepthTwoResolveScenario()];
}
