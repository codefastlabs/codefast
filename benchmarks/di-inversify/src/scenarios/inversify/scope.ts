/**
 * InversifyJS 8 — child-container scope scenarios. Parallel to
 * {@link ../codefast/scope.ts}.
 *
 * `new Container({ parent: ... })` is inversify's way of spelling
 * `codefast.createChild()`. Resolution cascades to the parent on a miss,
 * same semantic.
 */
import "reflect-metadata";
import { Container } from "inversify";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const CHILD_RESOLVE_BATCH = 500;

function buildChildDepthTwoResolveScenario(): BenchScenario {
  const childScopeLeafIdentifier = Symbol("bench-inv-child2-leaf");
  const rootContainer = new Container();
  rootContainer.bind<number>(childScopeLeafIdentifier).toConstantValue(42);
  const firstLevelChildContainer = new Container({ parent: rootContainer });
  const secondLevelChildContainer = new Container({ parent: firstLevelChildContainer });
  secondLevelChildContainer.get(childScopeLeafIdentifier);

  return {
    id: "child-depth-2-resolve",
    group: "scope",
    what: "resolve a parent binding from a depth-2 child (realistic per-request shape)",
    batch: CHILD_RESOLVE_BATCH,
    sanity: () => secondLevelChildContainer.get<number>(childScopeLeafIdentifier) === 42,
    build: () =>
      batched(CHILD_RESOLVE_BATCH, () => {
        secondLevelChildContainer.get(childScopeLeafIdentifier);
      }),
  };
}

export function buildInversifyScopeScenarios(): readonly BenchScenario[] {
  return [buildChildDepthTwoResolveScenario()];
}
