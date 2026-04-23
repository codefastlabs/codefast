/**
 * @codefast/di — child-container scope scenarios.
 *
 * Two rows here; the headline is the shallow one.
 *
 *   - `child-depth-2-resolve` (comparable) — resolve from a grandchild.
 *     This is the realistic shape: app container → per-request child →
 *     occasionally one more level. Depth 2 is what real apps build.
 *   - `child-depth-8-stress` (stress) — eight-deep chain of createChild(),
 *     resolve from the leaf. No real app has 8 container layers; this is
 *     a worst-case probe for the parent-walk cost. Kept as a stress row
 *     because it is useful to catch quadratic-in-depth regressions.
 */
import { Container, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CHILD_RESOLVE_BATCH = 500;
const STRESS_DEPTH = 8;

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

function buildChildDepthEightStressScenario(): BenchScenario {
  const childInheritanceLeafToken = token<number>("bench-cf-child8-leaf");
  const rootContainer = Container.create();
  rootContainer.bind(childInheritanceLeafToken).toConstantValue(42);
  let deepestChildContainer: Container = rootContainer;
  for (let childDepthIndex = 0; childDepthIndex < STRESS_DEPTH; childDepthIndex++) {
    deepestChildContainer = deepestChildContainer.createChild();
  }
  deepestChildContainer.resolve(childInheritanceLeafToken);

  return {
    id: "child-depth-8-stress",
    group: "scope",
    stress: true,
    what: "resolve through 8 nested child containers (worst-case parent walk)",
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => deepestChildContainer.resolve(childInheritanceLeafToken) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        deepestChildContainer.resolve(childInheritanceLeafToken);
      }),
  };
}

export function buildCodefastScopeScenarios(): readonly BenchScenario[] {
  return [buildChildDepthTwoResolveScenario(), buildChildDepthEightStressScenario()];
}
