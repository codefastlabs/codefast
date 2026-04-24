/**
 * @codefast/di — child-container scope scenarios.
 *
 * This package keeps only the production-shaped scope row:
 *   - `child-depth-2-resolve` — resolve from a grandchild.
 *     Shape: app container -> per-request child -> one nested child.
 */
import { Container, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CHILD_RESOLVE_BATCH = 500;

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const childScopeLeafToken = token<number>("bench-cf-child2-leaf");
  const rootContainer = Container.create();
  rootContainer.bind(childScopeLeafToken).toConstantValue(42);
  const firstLevelChildContainer = rootContainer.createChild();
  const secondLevelChildContainer = firstLevelChildContainer.createChild();
  secondLevelChildContainer.resolve(childScopeLeafToken);

  return {
    id: "child-depth-2-resolve",
    group: "scope",
    what: "resolve a parent binding from a depth-2 child (realistic per-request shape)",
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => secondLevelChildContainer.resolve(childScopeLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        secondLevelChildContainer.resolve(childScopeLeafToken);
      }),
  };
}

export function buildCodefastScopeScenarios(): readonly BenchScenario[] {
  return [buildChildDepthTwoResolveScenario()];
}
